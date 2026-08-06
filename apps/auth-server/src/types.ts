import { User, Session } from "@authgate/core";

export type Env = {
  Variables: {
    user: User;
    session: Session;
  };
};
