'use client';

import { useState } from 'react';
import { PageContainer, PageHeader, Card, Button, Badge, Grid } from '@/components/ui';
import WithSidebar from '@/components/layouts/WithSidebar';
import AnswersSidebar from '@/components/sidebars/AnswersSidebar';

type TabKey = 'textbook';

const TABS: { key: TabKey; label: string }[] = [
	{ key: 'textbook', label: '교대경시대비반 교재' },
];

type KyodaeBook = {
	id: string;
	label: string; // 예: '1권'
};

const KYODAE_BOOKS: KyodaeBook[] = [
	{ id: 'book1', label: '1권' },
	{ id: 'book2', label: '2권' },
];

// 교대 1권 정답 (1~87번)
const KYODAE_BOOK_ANSWERS: Record<string, string[]> = {
	book1: [
		// 1-5
		'40','4','8','4','212',
		// 6-10
		'20','15','17','44','834',
		// 11-15
		'32','370','19','56','851',
		// 16-20
		'14','352','18','6','128',
		// 21-25
		'32','36','825','15','197',
		// 26-30
		'505','20','6','7','60',
		// 31-35
		'4','22','20','8','8',
		// 36-40
		'51','16','39','825','80',
		// 41-45
		'6','7','3','163','31',
		// 46-50
		'30','12','5','91','54',
		// 51-55
		'356','8','441','20','16',
		// 56-60
		'8','458','40','42','8',
		// 61-65
		'5','24','11','11','15',
		// 66-70
		'34','80','5','6','155',
		// 71-75
		'12','96','25','11','33',
		// 76-80
		'10','144','10','11','90',
		// 81-85
		'20','13','28','21','23',
		// 86-87
		'456','213'
	],
	book2: [
		// 1-10
		'54','24','36','988','48','74','12','374','7','6',
		// 11-20
		'2','3','31','625','50','2','45','13','2','5',
		// 21-30
		'648','396','7','3','111','4','26','110','109','16',
		// 31-40
		'18','5','7','49','992','49','863','52','12','525',
		// 41-50
		'65','234','11','8','13','3','6','27','43','6',
		// 51-60
		'41','11','160','8','42','4','7','547','172','25',
		// 61-70
		'11','5','14','10','976','16','9','7','6','126',
		// 71-80
		'216','14','120','252','6','216','8','64','9','12',
		// 81-90
		'36','21','11','9','236','7','13','16','943','453',
		// 91-100 (제공된 값만)
		'20'
	]
};

export default function KyodaeAnswersPage() {
	const [activeTab, setActiveTab] = useState<TabKey>('textbook');
	const [bookId, setBookId] = useState<string>(KYODAE_BOOKS[0].id);

	const chunk = <T,>(arr: T[], size: number): T[][] => {
		const out: T[][] = [];
		for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
		return out;
	};

	return (
		<PageContainer maxWidth="xl">
			<WithSidebar sidebar={<AnswersSidebar />}> 
			{/* 안내 문구 및 유틸 섹션 숨김 */}

			{/* 탭 */}
			<div className="mb-6">
				<nav aria-label="Tabs" className="inline-flex gap-2 p-1 bg-card border border-default rounded-lg shadow-sm">
					{TABS.map((tab) => {
						const isActive = activeTab === tab.key;
						return (
							<button
								key={tab.key}
								onClick={() => setActiveTab(tab.key)}
								className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
									isActive
										? 'bg-primary text-white shadow'
										: 'text-muted hover:text-title hover:bg-hover'
								}`}
							>
								{tab.label}
							</button>
						);
					})}
				</nav>
			</div>

			{/* 콘텐츠 */}
			<Card>
					{activeTab === 'textbook' && (
						<div className="space-y-6">
							<h2 className="text-lg font-semibold text-title">교대경시대비반 교재</h2>

							<section>
								<h3 className="text-md font-semibold text-title mb-2">권 선택</h3>
								<div className="flex flex-wrap gap-2">
									{KYODAE_BOOKS.map(b => {
										const active = b.id === bookId;
										return (
											<Button
												key={b.id}
												onClick={() => setBookId(b.id)}
												variant={active ? 'primary' : 'outline'}
												size="sm"
											>
												{b.label}
											</Button>
										);
									})}
								</div>
							</section>

							<section>
								<h3 className="text-md font-semibold text-title mb-2">정답 (1권)</h3>
								<div className="grid grid-cols-1 gap-3">
									{chunk(KYODAE_BOOK_ANSWERS[bookId] ?? [], 5).map((block, bi) => {
										const startNum = bi * 5 + 1;
										return (
											<div key={`block-${bi}`} className="overflow-x-auto">
												<table className="min-w-[360px] w-full table-fixed border border-default text-sm">
													<thead className="bg-hover">
														<tr>
															{block.map((_, idx) => (
																<th key={`h-${bi}-${idx}`} className="px-3 py-2 leading-6 border-b border-default text-center text-title">{startNum + idx}</th>
															))}
														</tr>
													</thead>
													<tbody>
														<tr>
															{block.map((ans, idx) => (
																<td key={`a-${bi}-${idx}`} className="px-3 py-2 leading-6 border-b border-default text-center text-body">{ans}</td>
															))}
														</tr>
													</tbody>
												</table>
											</div>
										);
									})}
								</div>
							</section>
						</div>
					)}
			</Card>
			</WithSidebar>
		</PageContainer>
	);
}


