import {
  render,
  renderHook as rtlRenderHook,
  type RenderOptions,
  type RenderHookOptions,
} from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { ReactElement, ReactNode } from "react"

/**
 * Create a fresh QueryClient for testing with retries disabled.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

/**
 * Wrapper component providing QueryClientProvider for tests.
 */
function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}

/**
 * Custom render function that wraps components with test providers.
 * Use this instead of @testing-library/react render for components
 * that use TanStack Query hooks.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: TestProviders, ...options })
}

/**
 * Custom renderHook that wraps hooks with test providers.
 * Use this instead of @testing-library/react renderHook for hooks
 * that use TanStack Query.
 */
function customRenderHook<Result, Props>(
  hook: (props: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, "wrapper">,
) {
  return rtlRenderHook(hook, { wrapper: TestProviders, ...options })
}

/**
 * Creates a per-test wrapper with a fresh QueryClient.
 * Use this with renderHook when you need isolated query state per test.
 */
function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

export { customRender as render, customRenderHook as renderHook, createTestQueryClient, createWrapper }
