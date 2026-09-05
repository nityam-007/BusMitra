import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function SMSModal({ open, onClose, eta, stopName }) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{t('sms_simulation_title')}</DialogTitle>
          <DialogDescription className="sr-only">A simulated feature phone showing an SMS message.</DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-[280px] w-full shadow-inner border-[4px] border-gray-800">
            <div className="font-mono text-green-400 text-sm flex flex-col gap-3 whitespace-pre-wrap">
              <p>To: 77333</p>
              <p>Msg: BUS M1</p>
              <div>
                <p className="border-t border-green-800/50 pt-2 mb-1">{t('reply_label')}</p>
                <p>{t('sms_msg_body', { min: eta?.min, max: eta?.max, stopName: stopName })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <Button onClick={onClose} variant="secondary">{t('close_btn')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
