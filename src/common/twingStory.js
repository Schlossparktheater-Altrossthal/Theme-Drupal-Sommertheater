import environment from "../../.storybook/twingEnvironment";

// Cheerfully stolen from
// https://github.com/NightlyCommit/twing-loader/issues/33#issuecomment-889409418.
export default (twingComponent, formatArgs) => {
  const finalComponent = (_, { loaded: { component } }) => component;

  finalComponent.render = async (args) => {
    if (typeof formatArgs === "function") {
      args = formatArgs(args);
    }

    return await twingComponent.render(environment, args);
  };

  return finalComponent;
};
