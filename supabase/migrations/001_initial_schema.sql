-- ============================================================
-- PROFILES: extends Supabase auth.users
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    github_username TEXT,
    balance INTEGER NOT NULL DEFAULT 1000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- REPOS: cached GitHub repo metadata
-- ============================================================
CREATE TABLE public.repos (
    id BIGSERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    description TEXT,
    stars INTEGER DEFAULT 0,
    language TEXT,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.repos ADD CONSTRAINT repos_owner_name_unique UNIQUE (owner, name);

-- ============================================================
-- BOUNTIES
-- ============================================================
CREATE TABLE public.bounties (
    id BIGSERIAL PRIMARY KEY,
    repo_id BIGINT NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
    issue_number INTEGER NOT NULL,
    issue_title TEXT NOT NULL,
    issue_url TEXT NOT NULL,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount >= 5),
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'claimed', 'paid', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (repo_id, issue_number, creator_id)
);

-- ============================================================
-- SUBMISSIONS
-- ============================================================
CREATE TABLE public.submissions (
    id BIGSERIAL PRIMARY KEY,
    bounty_id BIGINT NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
    solver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pr_url TEXT NOT NULL,
    comment TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (bounty_id, solver_id)
);

-- ============================================================
-- TRANSACTIONS: wallet ledger
-- ============================================================
CREATE TABLE public.transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL
        CHECK (type IN ('signup_bonus', 'bounty_placed', 'bounty_earned',
                        'bounty_cancelled', 'bounty_refund')),
    bounty_id BIGINT REFERENCES public.bounties(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_bounties_status ON public.bounties(status);
CREATE INDEX idx_bounties_repo_id ON public.bounties(repo_id);
CREATE INDEX idx_bounties_creator_id ON public.bounties(creator_id);
CREATE INDEX idx_submissions_bounty_id ON public.submissions(bounty_id);
CREATE INDEX idx_submissions_solver_id ON public.submissions(solver_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);

-- ============================================================
-- AUTO-CREATE profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url, github_username, balance)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'user_name',
        1000
    );
    INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (NEW.id, 1000, 'signup_bonus', 'Welcome bonus');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- UPDATED_AT trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bounties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.submissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- RPC: place_bounty (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION public.place_bounty(
    p_creator_id UUID,
    p_repo_id BIGINT,
    p_issue_number INTEGER,
    p_issue_title TEXT,
    p_issue_url TEXT,
    p_amount INTEGER
) RETURNS BIGINT AS $$
DECLARE
    v_balance INTEGER;
    v_bounty_id BIGINT;
BEGIN
    SELECT balance INTO v_balance FROM public.profiles WHERE id = p_creator_id FOR UPDATE;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance: have %, need %', v_balance, p_amount;
    END IF;

    UPDATE public.profiles SET balance = balance - p_amount WHERE id = p_creator_id;

    INSERT INTO public.bounties (repo_id, issue_number, issue_title, issue_url, creator_id, amount)
    VALUES (p_repo_id, p_issue_number, p_issue_title, p_issue_url, p_creator_id, p_amount)
    RETURNING id INTO v_bounty_id;

    INSERT INTO public.transactions (user_id, amount, type, bounty_id, description)
    VALUES (p_creator_id, -p_amount, 'bounty_placed', v_bounty_id,
            'Placed bounty on ' || p_issue_title);

    RETURN v_bounty_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: approve_submission (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_submission(
    p_approver_id UUID,
    p_bounty_id BIGINT,
    p_submission_id BIGINT
) RETURNS VOID AS $$
DECLARE
    v_bounty RECORD;
    v_submission RECORD;
BEGIN
    SELECT * INTO v_bounty FROM public.bounties WHERE id = p_bounty_id FOR UPDATE;
    IF v_bounty.creator_id != p_approver_id THEN
        RAISE EXCEPTION 'Only the bounty creator can approve submissions';
    END IF;
    IF v_bounty.status != 'open' THEN
        RAISE EXCEPTION 'Bounty is not open';
    END IF;

    SELECT * INTO v_submission FROM public.submissions
        WHERE id = p_submission_id AND bounty_id = p_bounty_id;
    IF v_submission IS NULL THEN
        RAISE EXCEPTION 'Submission not found';
    END IF;

    UPDATE public.submissions SET status = 'approved' WHERE id = p_submission_id;
    UPDATE public.submissions SET status = 'rejected'
        WHERE bounty_id = p_bounty_id AND id != p_submission_id AND status = 'pending';
    UPDATE public.bounties SET status = 'paid' WHERE id = p_bounty_id;
    UPDATE public.profiles SET balance = balance + v_bounty.amount WHERE id = v_submission.solver_id;

    INSERT INTO public.transactions (user_id, amount, type, bounty_id, description)
    VALUES (v_submission.solver_id, v_bounty.amount, 'bounty_earned', p_bounty_id,
            'Earned bounty for ' || v_bounty.issue_title);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Repos (read-only for clients; inserts via service role)
CREATE POLICY "Repos are viewable by everyone"
    ON public.repos FOR SELECT USING (true);

-- Bounties
CREATE POLICY "Bounties are viewable by everyone"
    ON public.bounties FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create bounties"
    ON public.bounties FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Bounty creators can update own bounties"
    ON public.bounties FOR UPDATE USING (auth.uid() = creator_id);

-- Submissions
CREATE POLICY "Submissions are viewable by everyone"
    ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create submissions"
    ON public.submissions FOR INSERT WITH CHECK (auth.uid() = solver_id);
CREATE POLICY "Submission creators can update own submissions"
    ON public.submissions FOR UPDATE USING (auth.uid() = solver_id);

-- Transactions
CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- Enable Realtime on bounties and profiles
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bounties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
