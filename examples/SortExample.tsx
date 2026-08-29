import { t } from './i18n';
import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem, BGridItemRenderProps, BGridSortParam, toMoney } from 'beautiful-grid';
import { useContainerSize } from '../hooks/useContainerSize';
import DataGridContainer from '../components/DataGridContainer';
import { Progress } from 'antd';
import { Key, useState } from 'react';

interface Props {}

interface IListItem {
  nation: string;
  awpc: number;
  wpc: number;
  man: number;
  woman: number;
  ratio: number;
  ratioMan: number;
  ratioWoman: number;
}

const rawData = [
  [t('대한민국(15+ LFS)', 'South Korea(15+ LFS)'), 44504, 28186, 16090, 12097, 63, 73, 53],
  [t('아르메니아(15~75 LFS)', 'Armenia(15~75 LFS)'), 2204, 1563, 780, 783, 70, 76, 66],
  [t('아제르바이잔(15+ LFS)', 'Azerbaijan(15+ LFS)'), 0, 5190, 2664, 2526, 66, 69, 63],
  [t('부탄(15+ LFS)', 'Bhutan(15+ LFS)'), 482, 320, 169, 151, 66, 71, 61],
  [t('브루나이(15+ LFS)', 'Brunei(15+ LFS)'), 370, 238, 144, 94, 64, 72, 54],
  [t('캄보디아(15+ LFS)', 'Cambodia(15+ LFS)'), 11515, 8756, 4481, 4274, 76, 82, 69],
  [t('키프로스(15+ LFS)', 'Cyprus(15+ LFS)'), 712, 448, 236, 212, 63, 68, 57],
  [t('조지아(15+ LFS)', 'Georgia(15+ LFS)'), 3037, 1911, 1025, 886, 62, 72, 54],
  [t('홍콩(15+ LFS)', 'Hong Kong(15+ LFS)'), 6573, 3988, 1990, 1998, 60, 67, 55],
  [t('인도네시아(15+ LFS)', 'Indonesia(15+ LFS)'), 200485, 136808, 82760, 54048, 68, 82, 53],
  [t('이란(15+ LFS)', 'Iran(15+ LFS)'), 61658, 26940, 21707, 5233, 43, 70, 17],
  [t('이스라엘(15+ LFS)', 'Israel(15+ LFS)'), 6494, 4124, 2149, 1974, 63, 67, 59],
  [t('일본(15+ LFS)', 'Japan(15+ LFS)'), 110271, 68377, 37997, 30380, 62, 71, 53],
  [t('카자흐스탄(15+ LFS)', 'Kazakhstan(15+ LFS)'), 13131, 9203, 0, 0, 70, 0, 0],
  [t('키르기스스탄(15+ LFS)', 'Kyrgyzstan(15+ LFS)'), 4288, 2755, 1620, 1136, 64, 77, 51],
  [t('레바논(15+ LFS)', 'Lebanon(15+ LFS)'), 3677, 1798, 1230, 567, 48, 70, 29],
  [t('마카오(16+ LFS)', 'Macau(16+ LFS)'), 0, 395, 193, 202, 0, 74, 66],
  [t('말레이시아(15~64 LFS)', 'Malaysia(15~64 LFS)'), 22685, 15582, 9503, 6078, 68, 80, 55],
  [t('몰디브(15+ HIES)', 'Maldives(15+ HIES)'), 317, 202, 116, 86, 63, 78, 50],
  [t('몽골(15+ LFS)', 'Mongolia(15+ LFS)'), 2106, 1326, 706, 620, 63, 70, 55],
  [t('파키스탄(15+ LFS)', 'Pakistan(15+ LFS)'), 120220, 62030, 47845, 14185, 51, 79, 23],
  [t('필리핀(15+ LFS )', 'Philippines(15+ LFS )'), 73008, 43399, 26527, 16872, 59, 72, 46],
  [t('카타르(15+ LFS)', 'Qatar(15+ LFS)'), 2393, 2108, 1823, 285, 88, 95, 57],
  [t('사우디아라비아(15+ LFS)', 'Saudi Arabia(15+ LFS)'), 0, 0, 0, 0, 57, 80, 24],
  [t('싱가포르(15+ LFS)', 'Singapore(15+ LFS)'), 3422, 2329, 1251, 1077, 68, 75, 61],
  [t('스리랑카(15+ LFS)', 'Sri Lanka(15+ LFS)'), 16424, 8581, 5550, 3032, 52, 72, 34],
  [t('대만(15+ LFS)', 'Taiwan(15+ LFS)'), 20188, 11946, 6631, 5315, 59, 67, 51],
  [t('태국(15+ LFS)', 'Thailand(15+ LFS)'), 56575, 37885, 20611, 17274, 67, 75, 59],
  [t('튀르키예(15+ LFS)', 'Turkey(15+ LFS)'), 61468, 32524, 21855, 10669, 52, 72, 34],
  [t('아랍에미리트(15+ LFS)', 'UAE(15+ LFS)'), 9432, 7565, 5693, 1871, 80, 92, 57],
  [t('베트남(15+ LFS)', 'Vietnam(15+ LFS)'), 73394, 55507, 29068, 26440, 75, 81, 70],
];

const list = rawData.map((data, index) => {
  return {
    values: {
      nation: data[0],
      awpc: data[1],
      wpc: data[2],
      man: data[3],
      woman: data[4],
      ratio: data[5],
      ratioMan: data[5],
      ratioWoman: data[5],
    },
  };
});

const numRender = (item: BGridItemRenderProps<IListItem>) => <>{toMoney(item.value)}</>;

function SortExample(props: Props) {
  const [checkedKeys, setCheckedKeys] = useState<Key[]>();
  const [sortParams, setSortParams] = React.useState<BGridSortParam[]>([]);
  const [columns, setColumns] = React.useState<BGridColumn<IListItem>[]>([
    {
      key: 'nation',
      label: 'Nation',
      width: 150,
    },
    {
      key: 'awpc',
      label: 'active population',
      width: 150,
      align: 'right',
      itemRender: numRender,
    },
    { key: 'wpc', label: 'population', width: 100, align: 'right', itemRender: numRender },
    { key: 'man', label: 'Man', width: 100, align: 'right', itemRender: numRender },
    { key: 'woman', label: 'Woman', width: 100, align: 'right', itemRender: numRender },
    {
      key: 'ratio',
      label: 'Ratio',
      width: 150,
      align: 'right',
      itemRender: item => {
        return <Progress size={'small'} percent={item.values.ratio} style={{ margin: 0 }} />;
      },
    },
    { key: 'ratioMan', label: 'Man', width: 100, align: 'right' },
    { key: 'ratioWoman', label: 'Woman', width: 100, align: 'right' },
  ]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef);

  const sortedList = React.useMemo(() => {
    let i = 0,
      l = sortParams.length;

    return list
      .sort((a, b) => {
        for (i = 0; i < l; i++) {
          const sortInfo = sortParams[i];
          if (sortInfo.key === undefined) {
            continue;
          }

          let valueA = a.values[sortInfo.key as keyof IListItem],
            valueB = b.values[sortInfo.key as keyof IListItem];

          if (typeof valueA !== typeof valueB) {
            valueA = '' + valueA;
            valueB = '' + valueB;
          }
          if (valueA < valueB) {
            return sortInfo.orderBy === 'asc' ? -1 : 1;
          } else if (valueA > valueB) {
            return sortInfo.orderBy === 'asc' ? 1 : -1;
          }
        }

        return 0;
      })
      .slice() as BGridDataItem<IListItem>[];
  }, [sortParams]);

  return (
    <DataGridContainer ref={containerRef}>
      <BGrid<IListItem>
        width={containerWidth}
        height={containerHeight}
        headerHeight={35}
        data={sortedList}
        columns={columns}
        onChangeColumns={(columnIndex, { width, columns }) => {
          console.log('onChangeColumnWidths', columnIndex, width, columns);
          setColumns(columns);
        }}
        rowChecked={{
          checkedRowKeys: checkedKeys,
          onChange: (ids, keys, selectedAll) => {
            console.log('onChange rowSelection', ids, selectedAll);
            setCheckedKeys(keys);
          },
        }}
        sort={{
          sortParams,
          onChange: sortParams => {
            console.log('onChange: sortParams', sortParams);
            setSortParams(sortParams);
          },
        }}
        showLineNumber
        rowKey={'nation'}
      />
    </DataGridContainer>
  );
}

export default SortExample;
