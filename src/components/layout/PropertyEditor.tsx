import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useProjectStore } from '../../store/projectStore';
import type { EntityType } from '../../types/models';
import { Settings2, Save } from 'lucide-react';

export const PropertyEditor: React.FC = () => {
  const store = useProjectStore();
  const selectedItem = store.selectedItems[0];
  
  if (!selectedItem) {
    return (
      <aside className="sidebar-right" style={{ width: '280px', borderLeft: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-panel)', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }}>
          <Settings2 size={18} color="var(--accent)" />
          <span style={{ fontWeight: 600, color: '#fff' }}>Properties</span>
        </div>
        <div className="panel-content" style={{ padding: '24px', color: 'var(--text-tertiary)', textAlign: 'center', fontStyle: 'italic', fontSize: '0.9rem' }}>
          No item selected.<br/>Click an element or node in the 3D Viewer to edit its properties.
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar-right" style={{ width: '280px', borderLeft: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-panel)', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }}>
        <Settings2 size={18} color="var(--accent)" />
        <span style={{ fontWeight: 600, color: '#fff' }}>Properties</span>
      </div>
      <div className="panel-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <EntityForm item={selectedItem} store={store} />
      </div>
    </aside>
  );
};

const EntityForm: React.FC<{ item: { id: string; type: EntityType }, store: any }> = ({ item, store }) => {
  const { id, type } = item;
  
  const getDict = () => {
    switch(type) {
      case 'node': return store.nodes;
      case 'element': return store.elements;
      case 'material': return store.materials;
      case 'section': return store.sections;
      case 'boundaryCondition': return store.boundaryConditions;
      case 'loadCase': return store.loadCases;
      default: return null;
    }
  };

  const dict = getDict();
  const entity = dict ? dict[id] : null;

  const { register, handleSubmit, reset } = useForm({ defaultValues: entity || {} });

  useEffect(() => {
    if (entity) reset(entity);
  }, [id, type, entity, reset]);

  if (!entity) return <div style={{ color: 'var(--danger)' }}>Item not found</div>;

  const onSubmit = (data: any) => {
    if (type === 'node') {
      store.updateNode(id, { x: parseFloat(data.x), y: parseFloat(data.y), z: parseFloat(data.z) });
    } else if (type === 'element') {
      store.updateElement(id, { startNodeId: data.startNodeId, endNodeId: data.endNodeId, materialId: data.materialId, sectionId: data.sectionId });
    }
  };

  const renderField = (label: string, name: string, fieldType: 'text' | 'number' = 'text', step?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>
      <input 
        type={fieldType} 
        step={step} 
        {...register(name)} 
        style={{ padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--bg-border)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--bg-border)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{type}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)', marginTop: '4px' }}>{id}</div>
      </div>
      
      {type === 'node' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {renderField('X Coordinate (m)', 'x', 'number', 'any')}
          {renderField('Y Coordinate (m)', 'y', 'number', 'any')}
          {renderField('Z Coordinate (m)', 'z', 'number', 'any')}
        </div>
      )}

      {type === 'element' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {renderField('Start Node ID', 'startNodeId')}
          {renderField('End Node ID', 'endNodeId')}
          {renderField('Material ID', 'materialId')}
          {renderField('Section ID', 'sectionId')}
        </div>
      )}

      {type === 'material' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {renderField('Name', 'name')}
          {renderField('Elastic Modulus (E)', 'elasticModulus', 'number', 'any')}
          {renderField('Poisson Ratio', 'poissonRatio', 'number', 'any')}
        </div>
      )}

      {type === 'section' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {renderField('Name', 'name')}
          {renderField('Cross-Sectional Area', 'area', 'number', 'any')}
          {renderField('Moment of Inertia (Iy)', 'iy', 'number', 'any')}
          {renderField('Moment of Inertia (Iz)', 'iz', 'number', 'any')}
        </div>
      )}

      <button type="submit" className="btn-primary" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}>
        <Save size={16} /> Save Changes
      </button>
    </form>
  );
};
