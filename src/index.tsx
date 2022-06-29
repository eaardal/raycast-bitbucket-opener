import { useState, useEffect } from "react";
import { ActionPanel, Action, Form, LocalStorage, useNavigation, Detail } from "@raycast/api";

const ORG_KEY = "organization";
const ACTION_KEY = "defaultAction";

type UserAction = "home" | "pipelines" | "pull-requests";

interface UserActionsProps {
  org: string;
  repo: string;
  defaultAction: UserAction;
}

function UserActions({ org, repo, defaultAction }: UserActionsProps) {
  const { pop } = useNavigation();

  const homeAction = (
    <Action.OpenInBrowser
      key="home"
      title="Home"
      url={`https://bitbucket.org/${org}/${repo}`}
      onOpen={() => pop()}
      shortcut={{ modifiers: ["cmd"], key: "h" }}
    />
  );

  const pipelinesAction = (
    <Action.OpenInBrowser
      key="pipelines"
      title="Pipelines"
      url={`https://bitbucket.org/${org}/${repo}/pipelines`}
      onOpen={() => pop()}
      shortcut={{ modifiers: ["cmd"], key: "p" }}
    />
  );

  const pullRequestsAction = (
    <Action.OpenInBrowser
      key="pull-requests"
      title="Pull requests"
      url={`https://bitbucket.org/${org}/${repo}/pull-requests`}
      onOpen={() => pop()}
      shortcut={{ modifiers: ["cmd"], key: "r" }}
    />
  );

  function setActionsOrder(value: string): JSX.Element[] {
    switch (value) {
      case "home":
        return [homeAction, pipelinesAction, pullRequestsAction];
      case "pipelines":
        return [pipelinesAction, homeAction, pullRequestsAction];
      case "pull-requests":
        return [pullRequestsAction, homeAction, pipelinesAction];
      default:
        return [homeAction, pipelinesAction, pullRequestsAction];
    }
  }

  const [actions, setActions] = useState<JSX.Element[]>(setActionsOrder(defaultAction));

  useEffect(() => {
    setActions(setActionsOrder(defaultAction));
  }, [defaultAction, org, repo]);

  return <>{actions}</>;
}

export default function Command() {
  const [repo, setRepo] = useState("");
  const [org, setOrg] = useState("");
  const [defaultAction, setDefaultAction] = useState<UserAction | null>(null);

  async function onOrgChanged(value: string) {
    if (value.length === 0) {
      return;
    }

    setOrg(value);
    await LocalStorage.setItem(ORG_KEY, value);
  }

  async function onDefaultActionChanged(newValue: string) {
    if (["home", "pipelines", "pull-requests"].includes(newValue)) {
      setDefaultAction(newValue as UserAction);
      await LocalStorage.setItem(ACTION_KEY, newValue);
    } else {
      console.error(`onDefaultActionChanged: newValue ${newValue} is not a UserAction`);
    }
  }

  useEffect(() => {
    async function loadDefaults() {
      const prevOrg = await LocalStorage.getItem<string>(ORG_KEY);
      if (prevOrg) {
        setOrg(prevOrg);
      }

      const prevDefaultAction = await LocalStorage.getItem<string>(ACTION_KEY);
      if (prevDefaultAction) {
        setDefaultAction(prevDefaultAction as UserAction);
      } else {
        setDefaultAction("home");
      }
    }

    void loadDefaults();
  }, []);

  if (!defaultAction) {
    return <Detail markdown={"Loading..."} />;
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <UserActions org={org} repo={repo} defaultAction={defaultAction} />
        </ActionPanel>
      }
    >
      <Form.TextField id="org" title="Organization" onChange={onOrgChanged} value={org} />
      <Form.TextField id="repo" title="Repository name" onChange={setRepo} autoFocus />
      <Form.Dropdown id="default-action" title="Default action" value={defaultAction} onChange={onDefaultActionChanged}>
        <Form.Dropdown.Item value="home" title="Home" icon="🏠" />
        <Form.Dropdown.Item value="pipelines" title="Pipelines" icon="🛠️" />
        <Form.Dropdown.Item value="pull-requests" title="Pull requests" icon="📝" />
      </Form.Dropdown>
    </Form>
  );
}
