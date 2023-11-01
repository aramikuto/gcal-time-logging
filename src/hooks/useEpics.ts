import { useEffect, useState } from "react";
import { EpicData } from "../types";
import { Toast, showToast } from "@raycast/api";
import { t } from "i18next";
import { loadSavedData } from "../utils";

export const useEpics = () => {
  const [epics, setEpics] = useState<EpicData[] | undefined>(undefined);

  useEffect(() => {
    loadSavedData().then(({ epics }) => {
      setEpics(epics);
    });
  }, []);

  const addEpic = (newEpicName: string) => {
    if (epics === undefined) return;
    const [name_, ...description_] = newEpicName.split("/");
    const name = name_.trim();
    const description = description_.join("/").trim();

    if (epics.find((epic) => epic.name === name)) {
      showToast({
        title: t("Epic with this name already exists"),
        style: Toast.Style.Failure,
      });
      return;
    }

    if (!name) {
      showToast({
        title: t("Empty epic name"),
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

  const deleteEpic = (epicName: string) => {
    if (!epics) return;
    setEpics(epics.filter((epic) => epic.name !== epicName));
  };

  return {
    epics,
    deleteEpic,
    addEpic,
  };
};
