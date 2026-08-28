<template>
  <span class="trend" :class="trendClass">
    <span v-if="delta !== 0" class="trend__arrow">{{ delta > 0 ? '↑' : '↓' }}</span>
    {{ displayText }}
  </span>
</template>

<script setup lang="ts">
/**
 * 涨跌趋势组件（国内习惯：涨红跌绿）
 * 样式引用 design-tokens 的 .trend-up / .trend-down
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 环比值，正=涨 负=跌 0=持平 */
    delta: number;
    /** 后缀，如 '%'、'家'、'笔' */
    suffix?: string;
    /** 是否显示为纯文本（不显示正负号） */
    plain?: boolean;
  }>(),
  { suffix: '%', plain: false },
);

const trendClass = computed(() => (props.delta > 0 ? 'trend-up' : props.delta < 0 ? 'trend-down' : ''));
const displayText = computed(() => {
  const abs = Math.abs(props.delta);
  return props.plain ? `${abs}${props.suffix}` : `${abs}${props.suffix}`;
});
</script>

<style scoped>
.trend {
  font-size: 13px;
}
.trend__arrow {
  margin-right: 2px;
}
</style>
