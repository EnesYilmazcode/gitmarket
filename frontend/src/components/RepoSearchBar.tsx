import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function RepoSearchBar({ className }: { className?: string }) {
  const [url, setUrl] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const match = url.match(
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/\s]+)/
    )
    if (match) {
      const owner = match[1]
      const name = match[2].replace(/\.git$/, '')
      navigate(`/repo/${owner}/${name}`)
    } else {
      const parts = url.trim().split('/')
      if (parts.length === 2 && parts[0] && parts[1]) {
        navigate(`/repo/${parts[0]}/${parts[1]}`)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className || ''}`}>
      <Input
        placeholder="Paste a GitHub repo URL (e.g. facebook/react)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="h-11"
      />
      <Button type="submit" size="lg" className="shrink-0 gap-2">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  )
}
