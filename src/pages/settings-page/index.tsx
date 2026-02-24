import styles from './index.module.scss';

interface SettingsPageProps {
  onBack: () => void;
}

const shortcuts = [
  { key: 'n', desc: '新建记录', category: '记录' },
  { key: '/', desc: '搜索', category: '搜索' },
  { key: 'j', desc: '下一条', category: '导航' },
  { key: 'k', desc: '上一条', category: '导航' },
  { key: 'Enter', desc: '编辑选中记录', category: '导航' },
  { key: 'Escape', desc: '关闭弹窗', category: '操作' },
];

export function SettingsPage({ onBack }: SettingsPageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← 返回</button>
        <h2>设置</h2>
        <div style={{ width: 60 }} />
      </header>

      <section className={styles.section}>
        <h3>快捷键</h3>
        <div className={styles.shortcutList}>
          {shortcuts.map((s) => (
            <div key={s.key} className={styles.shortcutItem}>
              <kbd className={styles.key}>{s.key}</kbd>
              <span className={styles.desc}>{s.desc}</span>
              <span className={styles.category}>{s.category}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
