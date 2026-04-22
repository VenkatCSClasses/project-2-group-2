import type { ViewerRole } from './types'
import { viewerCanModerate } from './utils'

export function viewerCanDeleteContent(
  viewerRole: ViewerRole,
  viewerUsername: string,
  authorUsername: string | null
) {
  return (
    viewerCanModerate(viewerRole) ||
    (!!viewerUsername && viewerUsername === authorUsername)
  )
}
