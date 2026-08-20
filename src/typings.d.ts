declare module 'javascript-lp-solver' {
  interface Constraint {
    [key: string]: number;
    min?: number;
    max?: number;
    equal?: number;
  }

  interface Variable {
    [key: string]: number;
  }

  interface Model {
    optimize: string;
    opType: 'max' | 'min';
    constraints: Record<string, Constraint>;
    variables: Record<string, Variable>;
    ints?: Record<string, number>;
    binaries?: Record<string, number>;
    unrestricted?: Record<string, number>;
  }

  interface SolverResult {
    [key: string]: number;
    feasible: boolean;
    result: number;
  }

  namespace solver {
    function Solve(model: Model): SolverResult;
  }

  export default solver;
}
