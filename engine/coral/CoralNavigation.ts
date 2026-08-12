// ============================================
// WonderCards
// Coral Navigation Engine
// ============================================

export interface NavigationTarget {

    id: string;
  
    x: number;
  
    y: number;
  
  }
  
  export interface NavigationCommand {
  
    action:
      | "LEAD"
      | "FOLLOW"
      | "WAIT"
      | "LOOK_BACK"
      | "APPROACH"
      | "RETURN_HOME"
      | "CELEBRATE"
      | "IDLE";
  
    target?: NavigationTarget;
  }
  
  export class CoralNavigation {
  
    private current?: NavigationCommand;
  
    public execute(
      command: NavigationCommand,
    ) {
  
      this.current = command;
  
      // Animation system akan subscribe di sini
      console.log("[CoralNavigation]", command);
  
    }
  
    public lead(
      target: NavigationTarget,
    ) {
  
      this.execute({
  
        action: "LEAD",
  
        target,
  
      });
  
    }
  
    public follow(
      target: NavigationTarget,
    ) {
  
      this.execute({
  
        action: "FOLLOW",
  
        target,
  
      });
  
    }
  
    public approach(
      target: NavigationTarget,
    ) {
  
      this.execute({
  
        action: "APPROACH",
  
        target,
  
      });
  
    }
  
    public wait() {
  
      this.execute({
  
        action: "WAIT",
  
      });
  
    }
  
    public lookBack() {
  
      this.execute({
  
        action: "LOOK_BACK",
  
      });
  
    }
  
    public celebrate() {
  
      this.execute({
  
        action: "CELEBRATE",
  
      });
  
    }
  
    public returnHome(
      target: NavigationTarget,
    ) {
  
      this.execute({
  
        action: "RETURN_HOME",
  
        target,
  
      });
  
    }
  
    public idle() {
  
      this.execute({
  
        action: "IDLE",
  
      });
  
    }
  
    public currentCommand() {
  
      return this.current;
  
    }
  
  }