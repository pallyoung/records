import styles from './index.module.scss';

const hints = [
  { key: 'n', desc: '新建' },
  { key: '/', desc: '搜索' },
  { key: 'j↓', desc: '下' },
  { key: 'k↑', desc: '上' },
  { key: '↵', desc: '编辑' },
  { key: 'esc', desc: '关闭' },
];

export function KeyboardHints() {
  return (
    <div className={styles.hints}>
      {hints.map((h) => (
        <span key={h.key} className={styles.hint}>
          <kbd>{h.key}</kbd> {h.desc}
        </span>
      ))}
    </div>
  );
}
