import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function updateSession(
  request: NextRequest,
) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value);
            },
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options,
              );
            },
          );
        },
      },
    },
  );

  const { data, error } =
    await supabase.auth.getClaims();

  if (error) {
    console.error(
      "Erro ao verificar sessão:",
      error,
    );
  }

  const isPanelRoute =
    request.nextUrl.pathname.startsWith(
      "/painel",
    );

  if (!data?.claims && isPanelRoute) {
    const redirectUrl =
      request.nextUrl.clone();

    redirectUrl.pathname = "/login";

    return NextResponse.redirect(
      redirectUrl,
    );
  }

  return response;
}