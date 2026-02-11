export const initialState = {
    timeCharges: [],
    manpowerList: [],
    subsidiaryManpowerList: [],
    etfVersions: [],
    projectPhases: [],
    phaseStages: {},
    projectEtfs: [],
    weeks: [],
    userFriendlyWeeks: [],
    projectBudget: [],
    manpowerBudget: null,
    allocations: {},
};

export function etfReducer(state, action) {
    switch (action.type) {
        case 'SET_TIME_CHARGES':
            return {
                ...state,
                timeCharges: action.payload
            };
        case 'SET_MANPOWER_LIST':
            return {
                ...state,
                manpowerList: action.payload
            };
        case 'SET_MANPOWER_SUBSIDIARY_LIST':
            return {
                ...state,
                subsidiaryManpowerList: action.payload
            };
        case 'SET_ETF_VERSIONS':
            return {
                ...state,
                etfVersions: action.payload
            };
        case 'SET_PROJECT_PHASES':
            return {
                ...state,
                projectPhases: action.payload
            };
        case 'SET_PHASE_STAGES':
            return {
                ...state,
                phaseStages: action.payload
            };
        case 'SET_PROJECT_ETFS':
            return {
                ...state,
                projectEtfs: action.payload
            };
        case 'SET_WEEKS':
            return {
                ...state,
                weeks: action.payload
            };
        case 'SET_USER_FRIENDLY_WEEKS':
            return {
                ...state,
                userFriendlyWeeks: action.payload
            };
        case 'SET_PROJECT_BUDGET':
            return {
                ...state,
                projectBudget: action.payload
            };
        case 'SET_MANPOWER_BUDGET':
            return {
                ...state,
                manpowerBudget: action.payload
            };
        case 'SET_ALLOCATIONS':
            return {
                ...state,
                allocations: action.payload
            };
        default:
            return state;
    }
}

export function loadingReducer(state, action) {
    switch (action.type) {
        case "SET_PROJECT_LOADING":
            return { 
                ...state, 
                isProjectLoading: action.payload 
            };
        case "SET_VERSION_LOADING":
            return {
                ...state,
                isVersionLoading: action.payload
            };
        case "SET_PHASE_LOADING":
            return {
                ...state,
                isPhaseLoading: action.payload
            };
        default:
            return state;
    }
}

export function modalReducer(state, action) {
    switch (action.type) {
        case "SET_IS_MODAL_OPEN":
            return {
                ...state,
                isModalOpen: action.payload
            };
        case "SET_MODAL_CLOSE":
            return {
                ...state,
                isModalOpen: false
            };
        default:
            return state;
    }
}
