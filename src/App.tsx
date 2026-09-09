import { MantineProvider } from "@mantine/core";
import { LoginPage } from "./core/auth";
import { themeOverride } from "./core/theme/theme.override";

function App() {
  return (
    <MantineProvider theme={themeOverride}>
      <LoginPage />
    </MantineProvider>
  );
}

export default App;
