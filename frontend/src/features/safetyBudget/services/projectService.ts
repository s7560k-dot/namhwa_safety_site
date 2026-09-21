import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase-modular';
import { COLLECTIONS } from './collections';
import { ProjectSchema } from '../schemas/project.schema';
import type { Project } from '../schemas/project.schema';

/**
 * 프로젝트(현장) 정보를 조회한다. 기존 앱의 siteId(예: 'siteA')를 그대로 projectId로 사용한다.
 * @param projectId 조회할 프로젝트 id
 * @returns 프로젝트 정보, 존재하지 않으면 null
 */
export async function getProject(projectId: string): Promise<Project | null> {
    const snapshot = await getDoc(doc(db, COLLECTIONS.PROJECTS, projectId));
    if (!snapshot.exists()) {
        return null;
    }
    return ProjectSchema.parse({ id: snapshot.id, ...snapshot.data() });
}
