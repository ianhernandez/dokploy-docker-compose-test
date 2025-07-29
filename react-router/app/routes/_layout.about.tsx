import { useTranslation } from "react-i18next"
import { type MetaFunction, redirect } from "react-router"
import { convertDateToUserTz } from "~/utils/dates"
import type { Route } from "./+types/_layout._index"

export const meta: MetaFunction = () => {
  return [{ title: "New Remix App" }, { name: "description", content: "Welcome to Remix!" }]
}

export const loader = ({ request }: Route.LoaderArgs) => {
  const _timezoneDate = convertDateToUserTz(new Date(), request)
  // throw redirect("/login")
  return {
    timezoneDate: _timezoneDate,
  }
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { timezoneDate } = loaderData
  const { t } = useTranslation()

  return (
    <h1>About Us</h1>
  )
}
