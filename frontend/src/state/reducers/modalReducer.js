export const initialState = {
  active: null,
  data: null,
};

export function modalReducer(state, action) {
  switch (action.type) {
    case "OPEN_MODAL":
      return {
        active: action.modal,
        data: action.data ?? null,
      };

    case "CLOSE_MODAL":
      return initialState;

    default:
      return state;
  }
}
