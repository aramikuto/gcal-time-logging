import { useMemo } from "react";
import { EpicData } from "../types";

export const useEpicFilter = (epics: EpicData[] | undefined, workingOnEpicName: string | undefined, query: string) => {
  const filteredEpics = useMemo(() => {
    const [name_, ...description_] = query.split("/");
    const name = name_.trim().toLocaleLowerCase();
    const description = description_.join("/").trim().toLocaleLowerCase();
    return epics?.filter(
      (epic) =>
        epic.name.toLocaleLowerCase().includes(name) ||
        epic.description?.toLocaleLowerCase().includes(name) ||
        (description && epic.description?.toLocaleLowerCase().includes(description)),
    );
  }, [epics, query]);

  // If current working epic set, it should be on top
  const sortedEpics = useMemo(() => {
    if (!filteredEpics) return undefined;
    if (!workingOnEpicName) return filteredEpics;
    const workingEpicIndex = filteredEpics.findIndex((epic) => epic.name === workingOnEpicName);
    if (workingEpicIndex === -1) return filteredEpics;
    const workingEpic = filteredEpics[workingEpicIndex];
    const filteredEpicsWithoutWorkingEpic = filteredEpics.filter((epic) => epic !== workingEpic);
    return [workingEpic, ...filteredEpicsWithoutWorkingEpic];
  }, [epics, query, workingOnEpicName]);

  return sortedEpics;
};
