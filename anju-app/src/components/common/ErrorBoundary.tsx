import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ErrorState } from "./states"

interface Props {
  children: ReactNode
}

/** Catches render crashes so one broken screen doesn't blank the whole app. */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorState
          message={this.state.error.message}
          action={
            <Button variant="outline" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
          }
        />
      </div>
    )
  }
}
