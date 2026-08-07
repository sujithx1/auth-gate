import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Landing from "../pages/Landing";
import { queryClient, fetchUserSession } from "../router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  return (
    <Landing
      onGoToConsole={async () => {
        const user = await queryClient.fetchQuery({
          queryKey: ["session"],
          queryFn: fetchUserSession,
        });
        if (user) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/login" });
        }
      }}
    />
  );
}
