// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  useFlow,
  useGetAgents,
  useGetApplications,
  useGetUsers,
  useI18n,
  useTheme,
  useThunderID,
  useTranslation,
  useUser,
} from '@thunderid/react';
import {ReactElement, ReactNode, useState} from 'react';
import EventLog from '../components/EventLog';
import {describeError, track} from '../lib/events';
import {inspect} from '../lib/inspect';
import {sdkSignIn, sdkSignOut} from '../lib/sdk';

interface HookCardProps {
  actions?: ReactNode;
  children?: ReactNode;
  name: string;
  signature: string;
  value: unknown;
}

const HookCard = ({actions = null, children = null, name, signature, value}: HookCardProps): ReactElement => (
  <section className="pg-card" aria-label={name}>
    <div className="pg-card-head">
      <div>
        <h2 className="pg-mono">{name}</h2>
        <div className="pg-hook-sig">{signature}</div>
      </div>
      {actions && <div className="pg-row">{actions}</div>}
    </div>
    {children}
    <pre className="pg-json">{inspect(value)}</pre>
  </section>
);

interface QueryLike {
  data: unknown;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

const QueryCard = ({name, query}: {name: string; query: QueryLike}): ReactElement => (
  <HookCard
    name={name}
    signature="({limit}, {enabled: false}) => {data, error, isLoading, refetch}"
    value={{data: query.data, error: query.error?.message ?? null, isLoading: query.isLoading}}
    actions={
      <button
        type="button"
        className="pg-btn"
        data-size="sm"
        onClick={() => void track(name, () => query.refetch()).catch(() => undefined)}
      >
        Fetch
      </button>
    }
  >
    <p className="pg-empty">
      Management hook. Calls the ThunderID management API with the signed-in user&apos;s token.
    </p>
  </HookCard>
);

const Hooks = (): ReactElement => {
  const sdk = useThunderID();
  const user = useUser();
  const i18n = useI18n();
  const theme = useTheme();
  const flow = useFlow();
  const {t} = useTranslation();
  const users = useGetUsers({limit: 5}, {enabled: false});
  const applications = useGetApplications({limit: 5}, {enabled: false});
  const agents = useGetAgents({limit: 5}, {enabled: false});
  const [error, setError] = useState<string | null>(null);

  const call = (label: string, run: () => Promise<unknown>): void => {
    setError(null);
    track(label, run).catch((caught: unknown) => setError(describeError(caught)));
  };

  const languages: string[] = Object.keys(i18n.bundles);

  return (
    <main className="pg-main">
      <div className="pg-heading">
        <div>
          <h1>Hooks</h1>
          <p>
            Live values from every hook <span className="pg-accent">@thunderid/react</span> exposes. Functions are shown
            as signatures; use the buttons to call them.
          </p>
        </div>
      </div>

      {error && (
        <div className="pg-warning" role="alert">
          {error}
        </div>
      )}

      <div className="pg-grid-2">
        <HookCard
          name="useThunderID()"
          signature="ThunderIDContextProps: state, config, and auth functions"
          value={sdk}
          actions={
            <>
              <button
                type="button"
                className="pg-btn"
                data-size="sm"
                disabled={sdk.isSignedIn}
                onClick={() => call('signIn', () => sdkSignIn(sdk))}
              >
                signIn()
              </button>
              <button
                type="button"
                className="pg-btn"
                data-size="sm"
                onClick={() => call('signInSilently', () => sdk.signInSilently())}
              >
                signInSilently()
              </button>
              <button
                type="button"
                className="pg-btn"
                data-size="sm"
                disabled={!sdk.isSignedIn}
                onClick={() => call('signOut', () => sdkSignOut(sdk))}
              >
                signOut()
              </button>
            </>
          }
        />
        <HookCard
          name="useUser()"
          signature="{profile, flattenedProfile, userSchema, revalidateProfile, updateProfile, onUpdateProfile}"
          value={user}
          actions={
            <button
              type="button"
              className="pg-btn"
              data-size="sm"
              disabled={!sdk.isSignedIn}
              onClick={() => call('revalidateProfile', () => user.revalidateProfile())}
            >
              revalidateProfile()
            </button>
          }
        />
        <HookCard
          name="useI18n()"
          signature="{currentLanguage, fallbackLanguage, bundles, setLanguage, injectBundles, t}"
          value={{...i18n, bundles: languages}}
          actions={languages.map((language: string) => (
            <button
              key={language}
              type="button"
              className="pg-btn"
              data-size="sm"
              aria-pressed={language === i18n.currentLanguage}
              onClick={() => i18n.setLanguage(language)}
            >
              {language}
            </button>
          ))}
        />
        <HookCard
          name="useTranslation()"
          signature="(preferences?) => {t, currentLanguage, setLanguage, availableLanguages}"
          value={{
            "t('elements.buttons.signin.text')": t('elements.buttons.signin.text'),
            "t('elements.buttons.signout.text')": t('elements.buttons.signout.text'),
            "t('elements.buttons.signup.text')": t('elements.buttons.signup.text'),
          }}
        />
        <HookCard
          name="useTheme()"
          signature="{theme, colorScheme, direction, toggleTheme}"
          value={{
            colorScheme: theme.colorScheme,
            cssVariables: `${Object.keys(theme.theme.cssVariables ?? {}).length} variables`,
            direction: theme.direction,
            sample: Object.fromEntries(Object.entries(theme.theme.cssVariables ?? {}).slice(0, 8)),
            toggleTheme: theme.toggleTheme,
          }}
          actions={
            <button type="button" className="pg-btn" data-size="sm" onClick={theme.toggleTheme}>
              toggleTheme()
            </button>
          }
        />
        <HookCard
          name="useFlow()"
          signature="FlowContextValue: current step, title, messages for embedded flows"
          value={flow}
        />
        <QueryCard name="useGetUsers()" query={users} />
        <QueryCard name="useGetApplications()" query={applications} />
        <QueryCard name="useGetAgents()" query={agents} />
        <EventLog />
      </div>
    </main>
  );
};

export default Hooks;
