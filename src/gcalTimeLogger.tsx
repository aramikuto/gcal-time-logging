import {
  Action,
  ActionPanel,
  Detail,
  LocalStorage,
  Icon,
  List,
  showToast,
  Toast,
  showHUD,
  confirmAlert,
  Alert,
  getPreferenceValues,
} from "@raycast/api";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { EpicData, InProgressEpicData, Preferences } from "./types";

const preferences = getPreferenceValues<Preferences>();

const generateCalendarURL = (title: string, startDate: number, endDate: number) => {
  const base = preferences.templateEventUrl || "https://www.google.com/calendar/render?action=TEMPLATE";
  // return BASE64 encoded string. Dates are in the RFC 5545 format
  const startDateString = new Date(startDate).toISOString().replace(/[-:.]/g, "");
  const endDateString = new Date(endDate).toISOString().replace(/[-:.]/g, "");
  return `${base}&text=${encodeURIComponent(title)}&dates=${startDateString}/${endDateString}`;
};

export default function gcalTimeLogger() {
  const [inputEpicName, setInputEpicName] = useState("");
  const [epics, setEpics] = useState<EpicData[] | undefined>(undefined);
  const [workingOnEpicData, setWorkingOnEpicData] = useState<InProgressEpicData | null | undefined>(undefined);
  useEffect(() => {
    LocalStorage.getItem("epics").then((epics) => {
      if (epics && typeof epics === "string") {
        setEpics(JSON.parse(epics));
      } else {
        setEpics([]);
      }
    });
    LocalStorage.getItem("currentEpic").then((epicData) => {
      if (epicData) {
        if (typeof epicData === "string") {
          setWorkingOnEpicData(JSON.parse(epicData));
        } else {
          setWorkingOnEpicData(undefined);
        }
      } else {
        setWorkingOnEpicData(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!epics) return;
    LocalStorage.setItem("epics", JSON.stringify(epics));
  }, [epics, inputEpicName]);

  useEffect(() => {
    if (workingOnEpicData === undefined) return;
    if (workingOnEpicData === null) {
      LocalStorage.removeItem("currentEpic");
    } else {
      LocalStorage.setItem("currentEpic", JSON.stringify(workingOnEpicData));
    }
  }, [JSON.stringify(workingOnEpicData)]);

  const deleteEpic = (epicName: string) => {
    if (!epics) return;
    setEpics(epics.filter((epic) => epic.name !== epicName));
  };

  const addEpic = () => {
    if (epics === undefined) return;
    const [name_, ...description_] = inputEpicName.split("/");
    const name = name_.trim();
    const description = description_.join("/").trim();

    if (epics.find((epic) => epic.name === name)) {
      showToast({
        title: "エピック名が重複しています",
        style: Toast.Style.Failure,
      });
      return;
    }

    if (!name) {
      showToast({
        title: "エピック名が空です",
        style: Toast.Style.Failure,
      });
      return;
    }
    setEpics([
      ...epics,
      {
        name,
        description,
      },
    ]);
  };

  const filteredEpics = useMemo(() => {
    const [name_, ...description_] = inputEpicName.split("/");
    const name = name_.trim().toLocaleLowerCase();
    const description = description_.join("/").trim().toLocaleLowerCase();
    return epics?.filter(
      (epic) =>
        epic.name.toLocaleLowerCase().includes(name) ||
        epic.description?.toLocaleLowerCase().includes(name) ||
        (description && epic.description?.toLocaleLowerCase().includes(description)),
    );
  }, [epics, inputEpicName]);

  // If current working epic set, it should be on top
  const sortedEpics = useMemo(() => {
    if (!filteredEpics) return undefined;
    if (!workingOnEpicData?.name) return filteredEpics;
    const workingEpicIndex = filteredEpics.findIndex((epic) => epic.name === workingOnEpicData?.name);
    if (workingEpicIndex === -1) return filteredEpics;
    const workingEpic = filteredEpics[workingEpicIndex];
    const filteredEpicsWithoutWorkingEpic = filteredEpics.filter((epic) => epic !== workingEpic);
    return [workingEpic, ...filteredEpicsWithoutWorkingEpic];
  }, [epics, inputEpicName, workingOnEpicData?.name]);

  const startWork = (epicName: string) => {
    if (workingOnEpicData && workingOnEpicData?.name !== epicName) {
      confirmAlert({
        title: "未登録の作業があります",
        primaryAction: {
          title: "破棄して開始",
          style: Alert.ActionStyle.Destructive,
          onAction: () => {
            setWorkingOnEpicData({
              name: epicName,
              workStartedTimestamp: Date.now(),
            });
          },
        },
        dismissAction: {
          title: "戻る",
        },
      });
    } else {
      setWorkingOnEpicData({
        name: epicName,
        workStartedTimestamp: Date.now(),
      });
    }
  };

  const workStartedAt = workingOnEpicData?.workStartedTimestamp
    ? new Date(workingOnEpicData.workStartedTimestamp)
    : null;

  const TimeLogAction = useCallback(() => {
    if (!workingOnEpicData?.workStartedTimestamp) return null;
    const startTime = new Date(workingOnEpicData.workStartedTimestamp);
    const endTime = Date.now();
    const durationInMinutes = Math.floor((endTime - startTime.getTime()) / 1000 / 60);
    const url = generateCalendarURL(workingOnEpicData.name, startTime.getTime(), endTime);
    return (
      <Action.OpenInBrowser
        onOpen={() => {
          setWorkingOnEpicData(null);
          if (!workingOnEpicData?.workStartedTimestamp) {
            showToast({
              title: "開始時間がないため登録は失敗しました",
              style: Toast.Style.Failure,
            });
            return null;
          } else {
            showHUD(`作業時間は${durationInMinutes}分でした`);
          }
        }}
        icon={Icon.StopFilled}
        title="作業を終了(記録する)"
        // onAction={() => stopWork(true)}
        url={url}
        shortcut={{ modifiers: ["cmd"], key: "s" }}
      />
    );
  }, [workingOnEpicData?.name, workingOnEpicData?.workStartedTimestamp]);

  return (
    <>
      <Detail markdown="## Click on epic to delete it" />
      {/* <Form>
        <Form.TextField
          id="nameField"
          title="追加"
          placeholder="エピック名"
          onChange={handleNameChange}
          value={newEpicName}
        />
      </Form> */}
      <List
        filtering={false}
        onSearchTextChange={setInputEpicName}
        searchBarPlaceholder="エピック名 / デスクリプション（任意）"
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
                        text: `${String(workStartedAt.getHours()).padStart(2, "0")}:${String(
                          workStartedAt.getMinutes(),
                        ).padStart(2, "0")}から作業集です`,
                      },
                    ]
                  : []
              }
              actions={
                <ActionPanel title="エピック">
                  {workingOnEpicData?.name !== epic.name ? (
                    <>
                      <Action
                        icon={Icon.PlayFilled}
                        title="作業を開始"
                        onAction={() => startWork(epic.name)}
                        shortcut={{ modifiers: ["cmd"], key: "g" }}
                      />
                      <Action
                        icon={Icon.XMarkCircle}
                        title="エピックを一覧から削除する"
                        shortcut={{ modifiers: ["ctrl"], key: "d" }}
                        onAction={() => deleteEpic(epic.name)}
                      />
                    </>
                  ) : (
                    <>
                      <TimeLogAction />
                      <Action
                        icon={Icon.DeleteDocument}
                        title="作業を終了(記録しない)"
                        onAction={() => setWorkingOnEpicData(null)}
                        shortcut={{ modifiers: ["cmd"], key: "d" }}
                      />
                    </>
                  )}
                  <Action
                    icon={Icon.PlusCircle}
                    title="エピックを追加 (名前は検索クエリーになります)"
                    shortcut={{ modifiers: ["cmd"], key: "n" }}
                    onAction={() => epics && addEpic()}
                  />
                </ActionPanel>
              }
            />
          ))
        ) : (
          <List.EmptyView
            icon={Icon.PlusSquare}
            title="Actionsからエピックを登録しましょう！"
            actions={
              <ActionPanel title="エピック">
                <Action
                  icon={Icon.PlusCircle}
                  title="エピックを追加 (名前は検索クエリーになります)"
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                  onAction={() => epics && addEpic()}
                />
              </ActionPanel>
            }
          />
        )}
      </List>
    </>
  );
}
