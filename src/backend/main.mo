import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Option "mo:core/Option";
import Principal "mo:core/Principal";
import List "mo:core/List";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  public type Language = {
    #html_single;
    #html_css_js;
    #cpp;
    #javascript;
  };

  public type User = {
    id : Principal;
    username : Text;
    role : AccessControl.UserRole;
    createdAt : Time.Time;
  };

  // Members added by Class 6 — identified by username, authenticated via uploaded QR card
  public type MemberEntry = {
    username : Text;
    xutNumber : Text;
    qrCardData : Text; // base64 image data uploaded by Class 6
    createdAt : Time.Time;
  };

  public type Project = {
    id : Text;
    title : Text;
    language : Language;
    files : [ProjectFile];
    ownerId : Principal;
    isGlobal : Bool;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  public type ProjectFile = {
    filename : Text;
    content : Text;
  };

  public type Version = {
    versionId : Text;
    prompt : Text;
    files : [ProjectFile];
    createdAt : Time.Time;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let users = Map.empty<Principal, User>();
  let members = Map.empty<Text, MemberEntry>(); // keyed by username
  let projects = Map.empty<Text, Project>();
  let versions = Map.empty<Text, List.List<Version>>();
  let aiPreferenceRules = Map.empty<Nat, Text>();

  var isSeeded : Bool = false;
  var logoData : Text = "";

  module Project {
    public func compare(project1 : Project, project2 : Project) : Order.Order {
      switch (Text.compare(project1.title, project2.title)) {
        case (#equal) { Text.compare(project1.id, project2.id) };
        case (order) { order };
      };
    };
  };

  func onlyClass6(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only Class 6 can perform this action");
    };
  };

  func onlyOwnerOrClass6(caller : Principal, ownerId : Principal) {
    if (not (AccessControl.isAdmin(accessControlState, caller) or caller == ownerId)) {
      Runtime.trap("Unauthorized: Only project owner or Class 6 can perform this action");
    };
  };

  // ── Logo ──────────────────────────────────────────────────────────────────
  public shared ({ caller }) func setLogo(data : Text) : async () {
    onlyClass6(caller);
    logoData := data;
  };

  public query func getLogo() : async Text {
    logoData;
  };

  // ── Seed default Class 6 users ────────────────────────────────────────────
  public shared ({ caller }) func seedDefaultClass6Users() : async () {
    if (isSeeded) { return };
    if (not AccessControl.isAdmin(accessControlState, caller)) { return };
    isSeeded := true;
  };

  // ── Member management (username-based, no Principal required) ─────────────

  public shared ({ caller }) func addMember(username : Text, qrCardData : Text, xutNumber : Text) : async () {
    onlyClass6(caller);
    let entry : MemberEntry = {
      username;
      xutNumber;
      qrCardData;
      createdAt = Time.now();
    };
    members.add(username, entry);
  };

  public shared ({ caller }) func removeMemberByUsername(username : Text) : async () {
    onlyClass6(caller);
    members.remove(username);
  };

  public query ({ caller }) func getMembers() : async [MemberEntry] {
    onlyClass6(caller);
    members.values().toArray();
  };

  // Public — used for QR login verification
  public query func getMemberQR(username : Text) : async ?Text {
    switch (members.get(username)) {
      case (?entry) { ?entry.qrCardData };
      case (null) { null };
    };
  };

  public query func getMemberXUT(username : Text) : async ?Text {
    switch (members.get(username)) {
      case (?entry) { ?entry.xutNumber };
      case (null) { null };
    };
  };

  // ── User profiles (Internet Identity callers) ─────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?User {
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(username : Text) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot save profiles");
    };
    let role = AccessControl.getUserRole(accessControlState, caller);
    let resolvedRole : AccessControl.UserRole = if (role == #guest) { #user } else { role };
    switch (users.get(caller)) {
      case (?user) {
        let updatedUser : User = {
          id = user.id;
          username;
          role = user.role;
          createdAt = user.createdAt;
        };
        users.add(caller, updatedUser);
      };
      case (null) {
        let newUser : User = {
          id = caller;
          username;
          role = resolvedRole;
          createdAt = Time.now();
        };
        users.add(caller, newUser);
      };
    };
  };


  public query ({ caller }) func getUser() : async User {
    switch (users.get(caller)) {
      case (?user) { user };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public query ({ caller }) func getAllUsers() : async [User] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only Class 6 can view all users");
    };
    users.values().toArray();
  };

  // ── Projects ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func createProject(
    title : Text,
    language : Language,
    files : [ProjectFile],
    isGlobal : Bool,
  ) : async Text {
    let isClass6 = AccessControl.isAdmin(accessControlState, caller);
    let isMember = AccessControl.hasPermission(accessControlState, caller, #user);
    if (not (isClass6 or isMember)) {
      Runtime.trap("Unauthorized: Only Class 6 or members can create projects");
    };
    if (isGlobal and not isClass6) {
      Runtime.trap("Unauthorized: Only Class 6 can create global projects");
    };
    let projectId = title.concat(Time.now().toText());
    let newProject : Project = {
      id = projectId;
      title;
      language;
      files;
      ownerId = caller;
      isGlobal;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    projects.add(projectId, newProject);
    projectId;
  };

  public shared ({ caller }) func updateProject(
    projectId : Text,
    title : Text,
    language : Language,
    files : [ProjectFile],
    isGlobal : Bool,
  ) : async () {
    switch (projects.get(projectId)) {
      case (?existingProject) {
        onlyOwnerOrClass6(caller, existingProject.ownerId);
        let isClass6 = AccessControl.isAdmin(accessControlState, caller);
        if (isGlobal and not isClass6) {
          Runtime.trap("Unauthorized: Only Class 6 can mark projects as global");
        };
        let updatedProject : Project = {
          id = projectId;
          title;
          language;
          files;
          ownerId = existingProject.ownerId;
          isGlobal;
          createdAt = existingProject.createdAt;
          updatedAt = Time.now();
        };
        projects.add(projectId, updatedProject);
      };
      case (null) { Runtime.trap("Project not found") };
    };
  };

  public shared ({ caller }) func deleteProject(projectId : Text) : async () {
    switch (projects.get(projectId)) {
      case (?project) {
        onlyOwnerOrClass6(caller, project.ownerId);
        projects.remove(projectId);
        versions.remove(projectId);
      };
      case (null) { Runtime.trap("Project not found") };
    };
  };

  public query ({ caller }) func getProject(projectId : Text) : async Project {
    switch (projects.get(projectId)) {
      case (?project) {
        if (project.isGlobal or caller == project.ownerId or AccessControl.isAdmin(accessControlState, caller)) {
          project;
        } else {
          Runtime.trap("Unauthorized");
        };
      };
      case (null) { Runtime.trap("Project not found") };
    };
  };

  public query ({ caller }) func getAllGlobalProjects() : async [Project] {
    projects.values().toArray().filter(func(p) { p.isGlobal }).sort();
  };

  public query ({ caller }) func getCallerProjects() : async [Project] {
    projects.values().toArray().filter(func(p) { p.ownerId == caller }).sort();
  };

  // ── Versions ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func addVersion(projectId : Text, prompt : Text, files : [ProjectFile]) : async () {
    switch (projects.get(projectId)) {
      case (?project) {
        onlyOwnerOrClass6(caller, project.ownerId);
        let versionId = prompt.concat(Time.now().toText());
        let newVersion : Version = {
          versionId;
          prompt;
          files;
          createdAt = Time.now();
        };
        let existingVersions = switch (versions.get(projectId)) {
          case (?vs) { vs };
          case (null) { List.empty<Version>() };
        };
        existingVersions.add(newVersion);
        versions.add(projectId, existingVersions);
      };
      case (null) { Runtime.trap("Project not found") };
    };
  };

  public query ({ caller }) func getProjectVersions(projectId : Text) : async [Version] {
    switch (projects.get(projectId)) {
      case (?project) {
        if (not (project.isGlobal or caller == project.ownerId or AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized");
        };
        switch (versions.get(projectId)) {
          case (?vs) { vs.toArray() };
          case (null) { [] };
        };
      };
      case (null) { Runtime.trap("Project not found") };
    };
  };

  public shared ({ caller }) func revertToVersion(projectId : Text, versionId : Text) : async () {
    switch (projects.get(projectId), versions.get(projectId)) {
      case (?project, ?projectVersions) {
        onlyOwnerOrClass6(caller, project.ownerId);
        switch (projectVersions.find(func(v) { v.versionId == versionId })) {
          case (?targetVersion) {
            let revertedProject : Project = {
              id = project.id;
              title = project.title;
              language = project.language;
              files = targetVersion.files;
              ownerId = project.ownerId;
              isGlobal = project.isGlobal;
              createdAt = project.createdAt;
              updatedAt = Time.now();
            };
            projects.add(projectId, revertedProject);
          };
          case (null) { Runtime.trap("Version not found") };
        };
      };
      case _ { Runtime.trap("Project or versions not found") };
    };
  };

  // ── AI Preferences ────────────────────────────────────────────────────────

  public shared ({ caller }) func addAIPreferenceRule(rule : Text) : async () {
    onlyClass6(caller);
    aiPreferenceRules.add(aiPreferenceRules.size(), rule);
  };

  public shared ({ caller }) func removeAIPreferenceRule(index : Nat) : async () {
    onlyClass6(caller);
    aiPreferenceRules.remove(index);
  };

  public query func getAIPreferenceRules() : async [Text] {
    Array.tabulate(aiPreferenceRules.size(), func(i : Nat) : Text {
      switch (aiPreferenceRules.get(i)) {
        case (?rule) { rule };
        case (null) { "" };
      };
    });
  };
};
