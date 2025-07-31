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
		<div className="flex flex-col items-center justify-center h-full">
			<video className="h-120" autoPlay loop muted playsInline>
				<source src="https://vibeflow.com/images/vibeflow_logo_blue.mp4" type="video/mp4" />
			</video>
		</div>
	)
}
