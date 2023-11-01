import { useEffect, useState } from "react";
import { InProgressEpicData } from "../types";
import { loadSavedData } from "../utils";
import { Alert, confirmAlert } from "@raycast/api";
import { t } from "i18next";

export const useEpicInProgress = () => {
  const [workingOnEpicData, setWorkingOnEpicData] = useState<InProgressEpicData | null | undefined>(undefined);

  useEffect(() => {
    loadSavedData().then(({ workingOnEpicData }) => {
      setWorkingOnEpicData(workingOnEpicData);
    });
  }, []);

  const startWork = (epicName: string) => {
    const hasUnfinishedWork = workingOnEpicData && workingOnEpicData?.name !== epicName;
    const discardAndStartWork = () => {
      setWorkingOnEpicData({
        name: epicName,
        workStartedTimestamp: Date.now(),
      });
    };
    const showDiscardConfirmation = () =>
      confirmAlert({
        title: t("Discard ongoing work?"),
        primaryAction: {
          title: t("Discard"),
          style: Alert.ActionStyle.Destructive,
          onAction: discardAndStartWork,
        },
        dismissAction: {
          title: t("Cancel"),
        },
      });

    if (hasUnfinishedWork) {
      showDiscardConfirmation();
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

  return {
    workingOnEpicData,
    setWorkingOnEpicData,
    startWork,
    workStartedAt,
  };
};
