// Mock for next/server modules used by next-auth
export class NextRequest extends Request {
  nextUrl: URL
  cookies: Map<string, string>

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init)
    this.nextUrl = new URL(typeof input === 'string' ? input : input.toString())
    this.cookies = new Map()
  }
}

export class NextResponse extends Response {
  static json(data: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        ...init?.headers,
        'Content-Type': 'application/json',
      },
    })
  }

  static redirect(url: string | URL, status = 307) {
    return new Response(null, {
      status,
      headers: { Location: url.toString() },
    })
  }
}

export const cookies = () => ({
  get: () => undefined,
  set: () => {},
  delete: () => {},
  has: () => false,
  getAll: () => [],
})

export const headers = () => new Headers()
