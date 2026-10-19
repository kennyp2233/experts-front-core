import useSWR from 'swr';
import { maestrosService } from '../services/maestros.service';
import type { EdicionMaestro, EntidadMaestro, FichaMaestro, FormularioMaestro, PaginaMaestro } from '../types';

export const useEntidadesMaestros = () => {
  const { data, error, isLoading, mutate } = useSWR<EntidadMaestro[]>('maestros', () => maestrosService.entidades(), {
    revalidateOnFocus: false,
  });
  return { entidades: data, error, isLoading, mutate };
};

export const useListaMaestro = (entidad: string, q: string | undefined, page: number) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<PaginaMaestro>(
    ['maestros', entidad, q ?? '', page],
    () => maestrosService.listar(entidad, q, page),
    { keepPreviousData: true, revalidateOnFocus: false },
  );
  return { pagina: data, error, isLoading, isValidating, mutate };
};

export const useFichaMaestro = (entidad: string, id: string | number | null) => {
  const { data, error, isLoading } = useSWR<FichaMaestro>(
    id !== null ? ['maestros/ficha', entidad, String(id)] : null,
    () => maestrosService.ficha(entidad, id!),
    { revalidateOnFocus: false },
  );
  return { ficha: data, error, isLoading };
};

/** Formulario de la entidad (secciones, campos y opciones); solo si se edita. */
export const useFormularioMaestro = (entidad: string, activo: boolean) => {
  const { data, error, isLoading, mutate } = useSWR<FormularioMaestro>(
    activo ? ['maestros/formulario', entidad] : null,
    () => maestrosService.formulario(entidad),
    { revalidateOnFocus: false },
  );
  return { formulario: data, error, isLoading, mutate };
};

/** Valores del registro por campo del formulario y si se puede editar. */
export const useEdicionMaestro = (entidad: string, id: string | number | null, activo: boolean) => {
  const { data, error, isLoading, mutate } = useSWR<EdicionMaestro>(
    activo && id !== null ? ['maestros/edicion', entidad, String(id)] : null,
    () => maestrosService.edicion(entidad, id!),
    { revalidateOnFocus: false },
  );
  return { edicion: data, error, isLoading, mutate };
};
