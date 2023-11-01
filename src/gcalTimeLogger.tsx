import { Action, ActionPanel, Icon, List, getPreferenceValues, Detail } from "@raycast/api";
import { useEffect, useState } from "react";
import "./i18n";
import { useTranslation } from "react-i18next";

import type { Preferences } from "./types";
import { useEpics } from "./hooks/useEpics";
import { useEpicInProgress } from "./hooks/useEpicInProgress";
import { useMigrationManager } from "./hooks/useMigrationManager";
import { useEpicFilter } from "./hooks/useEpicFilter";
import { TimeLogAction } from "./components/TimeLogAction";

const preferences = getPreferenceValues<Preferences>();

export default function gcalTimeLogger() {
  const { t, i18n } = useTranslation();

  const [inputEpicName, setInputEpicName] = useState("");
  const { epics, deleteEpic, addEpic, updateLastUsedTimestamp, updateEpic } = useEpics();
  const { workingOnEpicData, setWorkingOnEpicData, startWork, workStartedAt } =
    useEpicInProgress(updateLastUsedTimestamp);
  const isMigrationNeeded = useMigrationManager();

  useEffect(() => {
    i18n.changeLanguage(preferences.locale || "en");
  }, [preferences.locale]);

  const sortedEpics = useEpicFilter(epics, workingOnEpicData?.name, inputEpicName);

  if (isMigrationNeeded === true) {
    return <Detail isLoading={isMigrationNeeded === undefined} markdown={`# ${t("Setting up...")}`} />;
  }

  return (
    <>
      <List
        filtering={false}
        onSearchTextChange={setInputEpicName}
        searchBarPlaceholder="Epic name / description (optional)"
        navigationTitle="Log time"
        isLoading={!epics || workingOnEpicData === undefined}
      >
        {sortedEpics && sortedEpics.length > 0 ? (
          sortedEpics.map((epic) => (
            <List.Item
              key={epic.name}
              title={epic.name}
              icon={Icon.PlayFilled}
              subtitle={epic.description}
              accessories={
                workingOnEpicData?.name === epic.name && workStartedAt
                  ? [
                      {
                        icon: Icon.PlayFilled,
                        text: t("Work started at", {
                          workStartedAt: `${String(workStartedAt.getHours()).padStart(2, "0")}:${String(
                            workStartedAt.getMinutes(),
                          ).padStart(2, "0")}`,
                        }),
                      },
                    ]
                  : []
              }
              actions={
                <ActionPanel title={t("Epic")}>
                  {workingOnEpicData?.name !== epic.name ? (
                    <>
                      <Action
                        icon={Icon.PlayFilled}
                        title={t("Start Working")}
                        onAction={() => startWork(epic.name)}
                        shortcut={{ modifiers: ["cmd"], key: "g" }}
                      />
                      <Action
                        icon={Icon.XMarkCircle}
                        title={t("Delete This Epic")}
                        shortcut={{ modifiers: ["ctrl"], key: "d" }}
                        onAction={() => deleteEpic(epic.name)}
                      />
                    </>
                  ) : (
                    <>
                      <TimeLogAction setWorkingOnEpic={setWorkingOnEpicData} workingOnEpic={workingOnEpicData} />
                      <Action
                        icon={Icon.DeleteDocument}
                        title={t("Finish Work (Discard Work)")}
                        onAction={() => setWorkingOnEpicData(null)}
                        shortcut={{ modifiers: ["cmd"], key: "d" }}
                      />
                    </>
                  )}
                  <Action
                    icon={Icon.PlusCircle}
                    title={t("Create Epic From Search Query")}
                    shortcut={{ modifiers: ["cmd"], key: "n" }}
                    onAction={() => epics && addEpic(inputEpicName)}
                  />
                  <Action
                    icon={Icon.Redo}
                    title={t("Edit Description")}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={() => updateEpic(epic.name, inputEpicName)}
                  />
                </ActionPanel>
              }
            />
          ))
        ) : (
          <List.EmptyView
            icon={Icon.PlusSquare}
            title="Create New Epic From Action Menu"
            actions={
              <ActionPanel title={t("Epic")}>
                <Action
                  icon={Icon.PlusCircle}
                  title={t("Create Epic From Search Query")}
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                  onAction={() => epics && addEpic(inputEpicName)}
                />
              </ActionPanel>
            }
          />
        )}
      </List>
    </>
  );
}
