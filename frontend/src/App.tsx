import './App.css'
import {AppBar, Box, Button, createTheme, CssBaseline, Stack, ThemeProvider, Toolbar, Typography} from "@mui/material";
import {GlobalRouting} from "./routes/Routes.tsx";
import {AdapterLuxon} from '@mui/x-date-pickers/AdapterLuxon'
import {LocalizationProvider} from "@mui/x-date-pickers";
import Logo from "./Logo.tsx";
import {DRAWER_WIDTH} from "./utils/utils.ts";
import styled from "styled-components";
import {ConfirmationDialogProvider} from "./utils/ConfirmationDialogContext.tsx";
import {ApiAccessProvider} from "./utils/ApiAccessContext.tsx";
import {NotificationContextProvider} from "./utils/NotificationContext.tsx";
import {WebsocketContextProvider} from "./utils/WebsocketContext.tsx";

function NamedLogo() {
  return <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{width: DRAWER_WIDTH}}>
    <Logo/>

    <Typography variant="h5"
                sx={{
                  fontFamily: 'monospace',
                  letterSpacing: '.2rem',
                  color: 'inherit',
                  textDecoration: 'none',
                }}>
      In the Mealtime
    </Typography>
  </Stack>;
}

function AppBarLinks() {
  return <Toolbar sx={{flexGrow: '1'}}>
    <Stack direction="row" spacing={2}>
      <Button color="inherit" href="/order">
        Bestellungen
      </Button>

      <Button color="inherit" href="/restaurant">
        Restaurants
      </Button>
    </Stack>
  </Toolbar>;
}

function AppBarMenu() {
  return <Button color="inherit">
    Profil
  </Button>;
}

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <NotificationContextProvider>
          <ConfirmationDialogProvider>
            <ApiAccessProvider>
              <WebsocketContextProvider>
                <Box sx={{width: '100%', height: '100%'}}>
                  <Box sx={{display: 'flex', width: '100%', height: '100%'}}>
                    <CssBaseline/>

                    <AppBar position="fixed" sx={{zIndex: (theme) => theme.zIndex.drawer + 1}} color="info">
                      <SStack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                        <NamedLogo/>

                        <AppBarLinks/>

                        <AppBarMenu/>
                      </SStack>
                    </AppBar>

                    <Box component="main" sx={{flexGrow: 1, p: 1, width: '100%', height: '100%',}}>
                      <Toolbar/>

                      <div style={{height: 'calc(100% - 64px)', maxHeight: 'calc(100% - 64px)'}}>
                        <GlobalRouting/>
                      </div>
                    </Box>
                  </Box>
                </Box>
              </WebsocketContextProvider>
            </ApiAccessProvider>
          </ConfirmationDialogProvider>
        </NotificationContextProvider>
      </LocalizationProvider>
    </ThemeProvider>

  )
}

export default App

const SStack = styled(Stack)`
    padding-right: 2em;
`;
