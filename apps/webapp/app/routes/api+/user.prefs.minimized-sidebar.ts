import { type ActionFunctionArgs, data } from "react-router";
import { setCookie, userPrefs } from "~/utils/cookies.server";
import { makeEstoqueSoftSystemError } from "~/utils/error";
import { payload, error } from "~/utils/http.server";

export async function action({ context, request }: ActionFunctionArgs) {
  const authSession = context.getSession();
  const { userId } = authSession;

  try {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};
    const bodyParams = await request.formData();
    cookie.minimizedSidebar = bodyParams.get("minimizeSidebar") === "open";

    return data(payload({ success: true, isTogglingSidebar: true }), {
      headers: [setCookie(await userPrefs.serialize(cookie))],
    });
  } catch (cause) {
    const reason = makeEstoqueSoftSystemError(cause, { userId });
    return data(error(reason), { status: reason.status });
  }
}
