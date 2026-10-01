type S = { company?: string; contact?: string | null; phone?: string | null; whatsapp?: string | null; email?: string | null; address?: string | null; products?: string | null }

export default function SupplierFields({ s }: { s?: S }) {
  return (
    <>
      <div className="grid-f">
        <div><label className="lbl">Empresa</label><input name="company" className="inp" defaultValue={s?.company ?? ''} required /></div>
        <div><label className="lbl">Contacto</label><input name="contact" className="inp" defaultValue={s?.contact ?? ''} /></div>
        <div><label className="lbl">Teléfono</label><input name="phone" className="inp" defaultValue={s?.phone ?? ''} /></div>
        <div><label className="lbl">WhatsApp</label><input name="whatsapp" className="inp" defaultValue={s?.whatsapp ?? ''} /></div>
        <div><label className="lbl">Correo</label><input type="email" name="email" className="inp" defaultValue={s?.email ?? ''} /></div>
        <div><label className="lbl">Dirección</label><input name="address" className="inp" defaultValue={s?.address ?? ''} /></div>
      </div>
      <label className="lbl">Productos que suministra</label>
      <textarea name="products" className="inp mb-3" rows={2} defaultValue={s?.products ?? ''} />
    </>
  )
}