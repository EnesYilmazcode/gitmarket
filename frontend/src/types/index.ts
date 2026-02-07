export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  github_username: string | null
  balance: number
  created_at: string
  updated_at: string
}

export interface Repo {
  id: number
  github_id: number
  owner: string
  name: string
  full_name: string
  description: string | null
  stars: number
  language: string | null
  url: string
  created_at: string
}

export interface Bounty {
  id: number
  repo_id: number
  issue_number: number
  issue_title: string
  issue_url: string
  creator_id: string
  amount: number
  status: 'open' | 'claimed' | 'paid' | 'cancelled'
  created_at: string
  updated_at: string
  repos?: Repo
  profiles?: Profile
}

export interface Submission {
  id: number
  bounty_id: number
  solver_id: string
  pr_url: string
  comment: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Transaction {
  id: number
  user_id: string
  amount: number
  type: 'signup_bonus' | 'bounty_placed' | 'bounty_earned' | 'bounty_cancelled' | 'bounty_refund'
  bounty_id: number | null
  description: string | null
  created_at: string
}

export interface GitHubIssue {
  number: number
  title: string
  html_url: string
  state: string
  labels: { name: string; color: string }[]
  user: { login: string; avatar_url: string }
  created_at: string
  comments: number
  bounty?: Bounty | null
}

export interface RepoSearchResult {
  repo: Repo
  issues: GitHubIssue[]
}
