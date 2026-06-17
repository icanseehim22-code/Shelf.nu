import { data } from "react-router";
import { makeEstoqueSoftSystemError } from "~/utils/error";
import { error } from "~/utils/http.server";

export async function loader() {
  try {
    const query = await fetch("https://formbricks.com/api/oss-friends");
    const response = await query.json();

    return data(response, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=604800",
      },
    });
  } catch (cause) {
    const reason = makeEstoqueSoftSystemError(cause);
    return data(error(reason), { status: reason.status });
  }
}
