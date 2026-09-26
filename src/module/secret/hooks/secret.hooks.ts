import { secretApi } from '@module/secret/api';

export const { useListSecretsQuery, useCreateSecretMutation, useRotateSecretMutation, useDeleteSecretMutation } =
	secretApi;
