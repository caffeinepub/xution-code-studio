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

  func onlyMember(caller : Principal) {
    if (AccessControl.getUserRole(accessControlState, caller) != #user) {
      Runtime.trap("Unauthorized: Only members can perform this action");
    };
  };

  func onlyOwnerOrClass6(caller : Principal, ownerId : Principal) {
    if (not (AccessControl.isAdmin(accessControlState, caller) or caller == ownerId)) {
      Runtime.trap("Unauthorized: Only project owner or Class 6 can perform this action");
    };
  };

  // Logo management (Class 6 only to set, public to get)
  public shared ({ caller }) func setLogo(data : Text) : async () {
    onlyClass6(caller);
    logoData := data;
  };

  public query func getLogo() : async Text {
    logoData;
  };

  public shared ({ caller }) func seedDefaultClass6Users() : async () {
    if (isSeeded) {
      Runtime.trap("Default users already seeded");
    };
    
    onlyClass6(caller);

    let class6User1Principal = Principal.fromText("aaaaa-aa");
    let class6User2Principal = Principal.fromText("aaaaa-aa");

    let class6User1 : User = {
      id = class6User1Principal;
      username = "Unity";
      role = #admin;
      createdAt = Time.now();
    };

    let class6User2 : User = {
      id = class6User2Principal;
      username = "Syndelious";
      role = #admin;
      createdAt = Time.now();
    };

    users.add(class6User1Principal, class6User1);
    users.add(class6User2Principal, class6User2);
    isSeeded := true;
  };

  public shared ({ caller }) func addMember(userId : Principal, username : Text) : async () {
    onlyClass6(caller);
    
    let newUser : User = {
      id = userId;
      username;
      role = #user;
      createdAt = Time.now();
    };
    
    users.add(userId, newUser);
    AccessControl.assignRole(accessControlState, caller, userId, #user);
  };

  public shared ({ caller }) func updateUserRole(userId : Principal, newRole : AccessControl.UserRole) : async () {
    onlyClass6(caller);
    
    switch (users.get(userId)) {
      case (?user) {
        let updatedUser : User = {
          id = user.id;
          username = user.username;
          role = newRole;
          createdAt = user.createdAt;
        };
        users.add(userId, updatedUser);
        AccessControl.assignRole(accessControlState, caller, userId, newRole);
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func removeMember(userId : Principal) : async () {
    onlyClass6(caller);
    users.remove(userId);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?User {
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    
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
          role = #user;
          createdAt = Time.now();
        };
        users.add(caller, newUser);
      };
    };
  };

  public query ({ caller }) func getUserProfile(userId : Principal) : async ?User {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(userId);
  };

  public query ({ caller }) func getUser() : async User {
    switch (users.get(caller)) {
      case (?user) { user };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public shared ({ caller }) func updateUsername(newUsername : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only members can update username");
    };
    
    switch (users.get(caller)) {
      case (?user) {
        let updatedUser : User = {
          id = user.id;
          username = newUsername;
          role = user.role;
          createdAt = user.createdAt;
        };
        users.add(caller, updatedUser);
      };
      case (null) { Runtime.trap("User not found") };
    };
  };

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
          Runtime.trap("Unauthorized: Cannot view versions for this project");
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

  public shared ({ caller }) func addAIPreferenceRule(rule : Text) : async () {
    onlyClass6(caller);
    aiPreferenceRules.add(aiPreferenceRules.size(), rule);
  };

  public shared ({ caller }) func removeAIPreferenceRule(index : Nat) : async () {
    onlyClass6(caller);
    aiPreferenceRules.remove(index);
  };

  public query ({ caller }) func getAIPreferenceRules() : async [Text] {
    let result = Array.tabulate(aiPreferenceRules.size(), func(i : Nat) : Text {
      switch (aiPreferenceRules.get(i)) {
        case (?rule) { rule };
        case (null) { "" };
      };
    });
    result;
  };

  public query ({ caller }) func getProject(projectId : Text) : async Project {
    switch (projects.get(projectId)) {
      case (?project) {
        if (project.isGlobal or caller == project.ownerId or AccessControl.isAdmin(accessControlState, caller)) {
          project;
        } else {
          Runtime.trap("Unauthorized: Only project owner or Class 6 can view this project");
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
};
