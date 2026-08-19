import MembersController from "./member";

declare global {
  var utils: {
    member: MembersController;
  };
}
