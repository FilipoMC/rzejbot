import { ModalKit, ButtonKit, MaybeArray } from "commandkit";

export class CommandkitBullshitHandler<
  Kit extends ModalKit | ButtonKit,
  MapKey = string,
> {
  private collectors = new Map<MapKey, MaybeArray<Kit>>();

  /**
   * Disposes old collectors and replaces them with newKit
   * @returns the old stored collectors, if any
   */
  public replaceOldCollector(key: MapKey, newKit: MaybeArray<Kit>) {
    const old = this.disposeCollector(key);
    this.collectors.set(key, newKit);
    return old;
  }

  /**
   * Adds a new collector to the map without disposing others
   */
  public addCollector(key: MapKey, kit: MaybeArray<Kit>) {
    const oldKit = this.collectors.get(key);

    let kitToSet: Kit[] = [];

    if (Array.isArray(kit)) {
      if (oldKit === undefined) {
        kitToSet = [...kit];
      } else if (Array.isArray(oldKit)) {
        kitToSet = [...oldKit, ...kit];
      } else {
        kitToSet = [oldKit, ...kit];
      }
    } else {
      if (oldKit === undefined) {
        kitToSet = [kit];
      } else if (Array.isArray(oldKit)) {
        kitToSet = [...oldKit, kit];
      } else {
        kitToSet = [oldKit, kit];
      }
    }

    this.collectors.set(key, kitToSet);
  }

  /**
   * Disposes all collectors and removes them from the map
   * @returns the old stored collectors, if any
   */
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
    return oldKit;
  }
}
