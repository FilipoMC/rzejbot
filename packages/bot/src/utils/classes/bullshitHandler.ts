import { ModalKit, ButtonKit } from "commandkit";

export class CommandkitBullshitHandler<
  Kit extends ModalKit | ButtonKit,
  MapKey = string,
> {
  private collectors = new Map<MapKey, Kit | Kit[]>();

  public replaceOldCollector(key: MapKey, newKit: Kit | Kit[]) {
    this.disposeCollector(key);
    this.collectors.set(key, newKit);
  }

  public disposeCollector(key: MapKey) {
    const oldKit = this.collectors.get(key);
    if (Array.isArray(oldKit)) {
      for (const kit of oldKit) {
        kit.dispose();
      }
    } else {
      oldKit?.dispose();
    }
    this.collectors.delete(key);
  }
}
