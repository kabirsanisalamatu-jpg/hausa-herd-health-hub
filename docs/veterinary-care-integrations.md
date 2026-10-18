# Veterinary care integrations

## Video
Video uses Daily private rooms only when `DAILY_API_KEY` is stored as a server secret. No key is bundled or placed in a `VITE_` variable. There is no configured Daily connection yet, so live calls must not be reported as tested.

The server verifies both appointment participation and current veterinary approval, sharing permission, blocking state, confirmed online status and the scheduled join window. Private room tokens expire within five minutes; room access requires renewal after expiry. Recording is disabled. Existing room URLs alone grant no access. Published video testing must cover two participants, token renewal, room expiry, mobile camera/microphone permissions and revoked sharing. Already-open third-party sessions require provider enforcement to guarantee immediate ejection after revocation; this is not yet implemented and video must remain unconfigured until that is addressed.

## AI
Uses the existing server `LOVABLE_API_KEY` and the Lovable AI Gateway Responses endpoint with the approved default model. Only the selected species and observations entered into the form are transmitted after explicit consent. No full clinical record, farmer contact or livestock identifier is sent to the model. The request and returned response are private to the farmer, separately labelled as AI assistance, never a consultation or prescription.

Persistent service pause state prevents replay after access or credit denials. An authorized operator may resume only after the underlying service access is restored; no automatic provider swapping or repeated probes. Prompt constraints are not a clinical safety certification; veterinary review and adversarial evaluation are required before treating this as complete.

## Attachments and photos
No storage or media-provider integration existed during inspection. Message attachments and profile photo upload are not enabled; text messaging is real and persisted. Do not substitute public uploads for private clinical storage.

## Safety and operational limits
No payment, pharmacy, email/SMS/push delivery or legal-compliance guarantee. Credentials are professional self-reported public fields associated with the existing verification workflow, not independently validated licence-registry results. Prescriptions are appended by approved assigned veterinarians after explicit review; corrections append superseding versions. Farmer administration is an explicit, separate action. Native Hausa and Nigerian veterinary/legal review remain necessary.