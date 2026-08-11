export type Language = 'ko' | 'en';

export const translations = {
  ko: {
    // Topbar
    view3d: '3D 뷰어',
    spreadsheet: '스프레드시트',
    report: '해석 보고서',
    aiAssistant: 'AI 어시스턴트',
    loadWizard: '하중 위저드',
    loadSample: '샘플 모델 불러오기',
    solveEngine: '구조 해석 실행',

    // Sidebar Explorer
    projectExplorer: '프로젝트 탐색기',
    nodes: '절점 (Nodes)',
    elements: '부재 (Elements)',
    materials: '재료 (Materials)',
    sections: '단면 (Sections)',
    boundaryCond: '경계 조건 (Supports)',
    loadCases: '하중 조건 (Load Cases)',
    combos: '하중 조합 (Combinations)',
    autoKDS: 'KDS 자동 생성',
    analysisSettings: '해석 방법 및 상세 설정',
    method: '해석 방식',
    linearStatic: '선형 정적 해석 (Linear Static)',
    nonlinearStatic: '비선형 해석 (P-Delta + 소성힌지)',
    loadSteps: '하중 증분 단계 (Steps)',
    tolerance: '허용 오차 (Tolerance)',

    // Property Editor
    properties: '속성 편집기',
    noSelection: '선택된 항목이 없습니다.',
    nodeId: '절점 번호',
    coordX: 'X 좌표 (m)',
    coordY: 'Y 좌표 (m)',
    coordZ: 'Z 좌표 (m)',
    startNode: '시작 절점',
    endNode: '끝 절점',
    material: '적용 재료',
    section: '적용 단면',
    
    // Bottom Panel
    bottomTitle: '해석 결과 및 콘솔',
    displacements: '변위 결과',
    reactions: '반력 결과',
    elementForces: '부재력 결과',
    node: '절점',
    element: '부재',
    noResults: '해석 결과가 없습니다. 상단의 [구조 해석 실행] 버튼을 클릭하세요.',

    // Common
    delete: '삭제',
    add: '추가',
    save: '저장',
    cancel: '취소',
    languageToggle: '🌐 한/Eng'
  },
  en: {
    // Topbar
    view3d: '3D View',
    spreadsheet: 'Spreadsheet',
    report: 'Report',
    aiAssistant: 'AI Assistant',
    loadWizard: 'Load Wizard',
    loadSample: 'Load Sample',
    solveEngine: 'Solve Engine',

    // Sidebar Explorer
    projectExplorer: 'Project Explorer',
    nodes: 'Nodes',
    elements: 'Elements',
    materials: 'Materials',
    sections: 'Sections',
    boundaryCond: 'Boundary Cond.',
    loadCases: 'Load Cases',
    combos: 'Combos',
    autoKDS: 'AUTO KDS',
    analysisSettings: 'Analysis Settings',
    method: 'Method',
    linearStatic: 'Linear Static',
    nonlinearStatic: 'Non-Linear (P-Delta + Hinge)',
    loadSteps: 'Load Steps',
    tolerance: 'Tolerance',

    // Property Editor
    properties: 'Properties',
    noSelection: 'No item selected',
    nodeId: 'Node ID',
    coordX: 'X Coord (m)',
    coordY: 'Y Coord (m)',
    coordZ: 'Z Coord (m)',
    startNode: 'Start Node',
    endNode: 'End Node',
    material: 'Material',
    section: 'Section',

    // Bottom Panel
    bottomTitle: 'Results & Console',
    displacements: 'Displacements',
    reactions: 'Reactions',
    elementForces: 'Element Forces',
    node: 'Node',
    element: 'Element',
    noResults: "No results available. Click 'Solve Engine' to run the analysis.",

    // Common
    delete: 'Delete',
    add: 'Add',
    save: 'Save',
    cancel: 'Cancel',
    languageToggle: '🌐 Eng/한'
  }
};
