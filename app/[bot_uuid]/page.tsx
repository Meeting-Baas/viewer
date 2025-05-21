import isUUID from "validator/lib/isUUID"
import { getMeetingData } from "@/lib/api/meeting-data"
import { headers } from "next/headers"
import { getAuthSession } from "@/lib/auth/session"
import { cache } from "react"
import { getAuthAppUrl } from "@/lib/auth/auth-app-url"
import { redirect } from "next/navigation"
import { Viewer } from "@/components/viewer"
import { AlertCircle } from "lucide-react"

const authAppUrl = getAuthAppUrl()
const getCachedAuthSession = cache(getAuthSession)

export default async function ViewerPage({
  params
}: {
  params: Promise<{ bot_uuid: string }>
}) {
  const [requestParams, requestHeaders] = await Promise.all([params, headers()])
  const { bot_uuid } = requestParams

  if (!bot_uuid || !isUUID(bot_uuid, 4)) {
    return (
      <div className="flex h-full w-full grow flex-col items-center justify-center gap-2 text-destructive">
        <AlertCircle className="size-8" />
        Invalid bot UUID
      </div>
    )
  }

  const requestCookies = requestHeaders.get("cookie")?.toString() || ""

  // RSCs need to pass cookies to getAuthSession
  const session = await getCachedAuthSession(requestCookies)

  if (!session) {
    // If the user is not authenticated, redirect to the sign-in page
    const redirectTo = requestHeaders.get("x-redirect-to")
    const redirectionUrl = redirectTo
      ? `${authAppUrl}/sign-in?redirectTo=${redirectTo}`
      : `${authAppUrl}/sign-in`
    redirect(redirectionUrl)
  }

  const meetingData = await getMeetingData(session.user.botsApiKey, bot_uuid)

  // Meeting data not found, either the bot is not found or the user doesn't have access to it
  if (!meetingData) {
    return (
      <div className="flex h-full w-full grow flex-col items-center justify-center gap-2 text-destructive">
        <AlertCircle className="size-8" />
        Meeting data not found
      </div>
    )
  }

  return <Viewer meetingData={meetingData} />
}
