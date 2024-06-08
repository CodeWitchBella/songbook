import type { PropsWithChildren } from "react";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";

import { PrimaryButton } from "./interactive/primary-button";

type State = { install?: (() => void) | null };
const Ctx = React.createContext({} as State);

export class InstallProvider extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = {};
  render() {
    return (
      <Ctx.Provider value={this.state}>{this.props.children}</Ctx.Provider>
    );
  }

  componentDidMount() {
    if (typeof window !== "undefined")
      window.addEventListener("beforeinstallprompt", (event: any) => {
        event.preventDefault();
        const install = () => {
          // hide button
          this.setState({ install: null });
          event.prompt();
          event.userChoice.then((choice: any) => {
            console.log(choice);
            if (choice.outcome !== "accepted") {
              // show it again
              this.setState({ install });
            }
          });
        };
        this.setState({
          install,
        });
      });
  }
  componentWillUnmount() {}
}

const useInstall = () => {
  const { install } = useContext(Ctx);
  return install ?? null;
};

export const InstallButtonLook = ({ children }: PropsWithChildren<{}>) => {
  const install = useInstall();
  const [t] = useTranslation();
  if (!install) return null;

  return (
    <>
      <PrimaryButton onPress={install ?? undefined}>
        {t("Install as an app")}
      </PrimaryButton>
      {children}
    </>
  );
};
