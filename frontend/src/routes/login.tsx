import { LargeInput } from "components/input";
import { InlineLink } from "components/interactive/inline-link";
import { PrimaryButton } from "components/interactive/primary-button";
import { LoginDone } from "components/login-done";
import { PageHeader } from "components/page-header";
import { TText } from "components/themed";
import { useLogin } from "components/use-login";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { View } from "react-native";

export default function Login() {
  const { t } = useTranslation();
  const login = useLogin();
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (evt: { preventDefault(): void }) => {
    evt.preventDefault();
    setStatus("loading");
    if (!email) {
      setStatus(t("Email must not be empty"));
    }
    login
      .login(email, password)
      .then((result) => {
        setStatus(result || "");
      })
      .catch((e) => {
        console.error(e);
        setStatus(t("Something went wrong"));
      });
  };
  return (
    <form
      onSubmit={submit}
      className="mx-auto flex max-w-lg flex-col gap-4 text-xl"
    >
      <PageHeader backTo="/about">{t("login-screen-title")}</PageHeader>
      {login.viewer ? (
        <LoginDone viewer={login.viewer} />
      ) : (
        <>
          <div className="-mt-8">{status !== "loading" && status}</div>
          <LargeInput
            label={t("Email")}
            value={email}
            onChange={setEmail}
            disabled={status === "loading"}
            type="email"
            name="email"
          />
          <LargeInput
            label={t("Password")}
            value={password}
            onChange={setPassword}
            disabled={status === "loading"}
            type="password"
            name="password"
          />
          <PrimaryButton onPress={submit} disabled={status === "loading"}>
            {t("Log in")}
          </PrimaryButton>
          <button style={{ display: "none" }} />
          <View style={{ marginTop: 16, alignItems: "flex-end" }}>
            <TText style={{ fontSize: 16 }}>
              <Trans>
                I don't have account,{" "}
                <InlineLink to="/register">register</InlineLink>
              </Trans>
            </TText>
          </View>
        </>
      )}
    </form>
  );
}
