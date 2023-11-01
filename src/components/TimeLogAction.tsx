import { Action, Icon, Toast, getPreferenceValues, showHUD, showToast } from "@raycast/api";
import { InProgressEpicData } from "../types";
import { generateCalendarURL } from "../utils";

import type { Preferences } from "../types";
import { t } from "i18next";

interface Props {
  workingOnEpic: InProgressEpicData | null;
  setWorkingOnEpic: (epicData: InProgressEpicData | null) => void;
}

export const TimeLogAction: React.FC<Props> = ({ workingOnEpic, setWorkingOnEpic }) => {
  const preferences = getPreferenceValues<Preferences>();

  if (!workingOnEpic?.workStartedTimestamp) return null;
  const startTime = new Date(workingOnEpic.workStartedTimestamp);
  const endTime = Date.now();
  const durationInMinutes = Math.floor((endTime - startTime.getTime()) / 1000 / 60);
  const url = generateCalendarURL({
    title: workingOnEpic.name,
    startDate: startTime.getTime(),
    endDate: endTime,
    templateEventUrl: preferences.templateEventUrl,
  });

  return (
    <Action.OpenInBrowser
      onOpen={() => {
        setWorkingOnEpic(null);
        if (!workingOnEpic?.workStartedTimestamp) {
          showToast({
            title: t("Failed to record time"),
            style: Toast.Style.Failure,
          });
          return null;
        } else {
          showHUD(t("WorkingTime", { durationInMinutes }));
        }
      }}
      icon={Icon.StopFilled}
      title={t("Finish working (record time)")}
      // onAction={() => stopWork(true)}
      url={url}
      shortcut={{ modifiers: ["cmd"], key: "s" }}
    />
  );
};
