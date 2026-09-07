<script lang="ts">
import { defineComponent, h } from 'vue'
// Imported only in H5. Pointer users keep Uni's existing picker; keyboard users
// get the browser's editable date segments and the exact same change payload.
export default defineComponent({
  props: { value: { type: String, default: '' }, max: { type: String, required: true } },
  emits: ['change'],
  setup(props, { emit }) {
    return () => h('input', {
      type: 'date', value: props.value, max: props.max,
      class: 'keyboard-date-input', 'aria-label': '出生日期', 'data-testid': 'public-profile-keyboard-date',
      onChange: (event: Event) => emit('change', { detail: { value: (event.target as HTMLInputElement).value } }),
    })
  },
})
</script>
<style>
.public-profile-date-control { position: relative; min-height: 44px; }
.keyboard-date-input { position: absolute; inset: 0; width: 100%; min-height: 44px; height: 100%; opacity: 0; pointer-events: none; box-sizing: border-box; padding: 10px 12px; border: 1px solid #c9e4da; border-radius: 12px; background: #f4fbf8; color: #102f2c; font: inherit; }
.keyboard-date-input:focus { opacity: 1; outline: 2px solid #0f766e; outline-offset: 2px; }
</style>
