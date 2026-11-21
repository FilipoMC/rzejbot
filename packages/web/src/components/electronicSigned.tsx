import { getManagers } from "@/lib/db";
import { shortRankNames } from "@shared/config/ranks";

export function ElectronicSigned({
  approvedByUM,
  managers,
}: {
  approvedByUM: boolean;
  managers: NonNullable<Awaited<ReturnType<typeof getManagers>>>;
}) {
  return (
    <div className="mt-10 self-center flex max-w-200 w-full italic text-muted-foreground">
      <div className="flex flex-col items-center">
        <div className="hidden sm:block">/ / / Podpis Elektrowniczny / / /</div>
        <div className="sm:hidden">/ / / Podp. Elektr. / / /</div>
        <div>
          {shortRankNames.get(managers.mainME.employeeChanges[0].newRole)}
          &nbsp;
          {managers.mainME.nameIC}
        </div>
      </div>
      <div className="grow"></div>
      {approvedByUM && (managers.unit.actingUM || managers.unit.mainUM) && (
        <div className="flex flex-col items-center">
          <div className="hidden sm:block">
            / / / Podpis Elektrowniczny / / /
          </div>
          <div className="sm:hidden">/ / / Podp. Elektr. / / /</div>
          {shortRankNames.get(
            (managers.unit.actingUM ?? managers.unit.mainUM)!.employeeChanges[0]
              .newRole,
          )}
          &nbsp;
          {(managers.unit.actingUM ?? managers.unit.mainUM)?.nameIC}
        </div>
      )}
    </div>
  );
}
