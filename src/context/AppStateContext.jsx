/**
 * AppStateContext — compatibility shim
 *
 * Tất cả components import `useAppState` từ file này.
 * Provider thực sự là ApiStateContext (dùng trong main.jsx).
 * File này chỉ re-export để không phải sửa từng component.
 */
export { useAppState } from './ApiStateContext'
