import { configureTokenNs } from '@mall/web-kit';

// 独立模块：保证在 router / store 等模块初始化读取 token 之前完成配置。
// （import 语句会被提升，写在 main.ts 里的顶层调用无法保证早于其它 import 的求值）
configureTokenNs('pf');
