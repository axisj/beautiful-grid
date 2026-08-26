import * as React from "react";

export function useForceUpdate() {
  const [value, setValue] = React.useState(0); // integer state
  return () => setValue(value => ++value); // update the state to force render
}
